import { GoogleGenAI } from "@google/genai"
import type { ScanProvider, SearchResult } from "./types"

async function resolveRedirect(url: string): Promise<string> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "manual" })
    const location = res.headers.get("location")
    if (location) return location
  } catch {
    // Fall through
  }
  return url
}

async function resolveSourceUrls(sources: Array<{ url: string; title: string }>) {
  const resolved: Array<{ url: string; title: string }> = []
  for (const s of sources) {
    const isRedirect = s.url.includes("vertexaisearch.cloud.google.com/grounding-api-redirect")
    const url = isRedirect ? await resolveRedirect(s.url) : s.url
    resolved.push({ ...s, url })
  }
  return resolved
}

export function createGeminiProvider(apiKey: string): ScanProvider {
  const ai = new GoogleGenAI({ apiKey })

  return {
    name: "gemini",

    async search(query: string): Promise<SearchResult> {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      })

      const sources: Array<{ url: string; title: string }> = []
      // biome-ignore lint/suspicious/noExplicitAny: Gemini SDK types are incomplete
      const metadata = (response as any).candidates?.[0]?.groundingMetadata

      if (metadata?.groundingChunks) {
        for (const chunk of metadata.groundingChunks) {
          if (chunk.web) {
            sources.push({ url: chunk.web.uri, title: chunk.web.title || "" })
          }
        }
      }

      const searchQueries: string[] = metadata?.webSearchQueries || []
      const resolvedSources = await resolveSourceUrls(sources)

      // biome-ignore lint/suspicious/noExplicitAny: Gemini SDK types are incomplete
      const usageMetadata = (response as any).usageMetadata
      const tokenUsage = usageMetadata
        ? {
            inputTokens: usageMetadata.promptTokenCount || 0,
            outputTokens: usageMetadata.candidatesTokenCount || 0,
            totalTokens: usageMetadata.totalTokenCount || 0,
          }
        : null

      return {
        response: response.text || "",
        sources: resolvedSources,
        searchQueries,
        tokenUsage,
      }
    },
  }
}

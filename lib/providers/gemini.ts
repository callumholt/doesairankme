import { GoogleGenAI } from "@google/genai"
import type { GenerateQueriesResult, ScanProvider, SearchResult } from "./types"

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

    async generateQueries(content: string, count: number): Promise<GenerateQueriesResult> {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are helping test AI discoverability for a business. Based on the following content, generate ${count} realistic questions that a potential customer might ask an AI assistant when looking for these kinds of services.

CRITICAL RULES:
- Do NOT mention the business name, brand name, product names, or any proprietary terms from the content
- These should be generic queries from someone who does NOT know this business exists yet
- Think about what problem the customer has, not what solution this business offers
- Mix broad category queries with specific problem-based queries
- Include location-specific queries where relevant based on the business's actual location

Return a JSON array of strings only, no other text.

Content:
${content}`,
      })

      const text = response.text?.trim() || ""
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error("Failed to parse query list from model response")

      // biome-ignore lint/suspicious/noExplicitAny: Gemini SDK types are incomplete
      const usageMetadata = (response as any).usageMetadata
      const tokenUsage = usageMetadata
        ? {
            inputTokens: usageMetadata.promptTokenCount || 0,
            outputTokens: usageMetadata.candidatesTokenCount || 0,
            totalTokens: usageMetadata.totalTokenCount || 0,
          }
        : null

      return { queries: JSON.parse(jsonMatch[0]), tokenUsage }
    },

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

      // Extract token usage
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

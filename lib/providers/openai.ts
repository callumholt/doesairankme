import type { ScanProvider, SearchResult } from "./types"

const OPENAI_BASE = "https://api.openai.com/v1/responses"

export function createOpenAIProvider(apiKey: string): ScanProvider {
  return {
    name: "openai",

    async search(query: string): Promise<SearchResult> {
      const res = await fetch(OPENAI_BASE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          tools: [{ type: "web_search_preview" }],
          input: query,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`OpenAI API error (${res.status}): ${err}`)
      }

      const data = await res.json()

      let responseText = ""
      const sources: Array<{ url: string; title: string }> = []
      const seenUrls = new Set<string>()

      if (data.output) {
        for (const item of data.output) {
          if (item.type === "message") {
            for (const content of item.content || []) {
              if (content.type === "output_text") {
                responseText = content.text || ""
                if (content.annotations) {
                  for (const annotation of content.annotations) {
                    if (annotation.type === "url_citation" && annotation.url && !seenUrls.has(annotation.url)) {
                      seenUrls.add(annotation.url)
                      sources.push({ url: annotation.url, title: annotation.title || "" })
                    }
                  }
                }
              }
            }
          }
        }
      }

      const tokenUsage = data.usage
        ? {
            inputTokens: data.usage.input_tokens || 0,
            outputTokens: data.usage.output_tokens || 0,
            totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
          }
        : null

      return {
        response: responseText,
        sources,
        searchQueries: [query],
        tokenUsage,
      }
    },
  }
}

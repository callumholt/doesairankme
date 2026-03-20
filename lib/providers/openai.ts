import type { GenerateQueriesResult, ScanProvider, SearchResult } from "./types"

const OPENAI_BASE = "https://api.openai.com/v1/responses"

export function createOpenAIProvider(apiKey: string): ScanProvider {
  return {
    name: "openai",

    async generateQueries(content: string, count: number): Promise<GenerateQueriesResult> {
      const res = await fetch(OPENAI_BASE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          input: `You are helping test AI discoverability for a business. Based on the following content, generate ${count} realistic questions that a potential customer might ask an AI assistant when looking for these kinds of services.

CRITICAL RULES:
- Do NOT mention the business name, brand name, product names, or any proprietary terms from the content
- These should be generic queries from someone who does NOT know this business exists yet
- Think about what problem the customer has, not what solution this business offers
- Mix broad category queries with specific problem-based queries
- Include location-specific queries where relevant based on the business's actual location

Return a JSON array of strings only, no other text.

Content:
${content}`,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`OpenAI API error (${res.status}): ${err}`)
      }

      const data = await res.json()
      const text = data.output?.[0]?.content?.[0]?.text || ""
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error("Failed to parse query list from model response")

      const tokenUsage = data.usage
        ? {
            inputTokens: data.usage.input_tokens || 0,
            outputTokens: data.usage.output_tokens || 0,
            totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
          }
        : null

      return { queries: JSON.parse(jsonMatch[0]), tokenUsage }
    },

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

      // Extract response text and sources from the output
      let responseText = ""
      const sources: Array<{ url: string; title: string }> = []
      const seenUrls = new Set<string>()

      if (data.output) {
        for (const item of data.output) {
          if (item.type === "message") {
            for (const content of item.content || []) {
              if (content.type === "output_text") {
                responseText = content.text || ""
                // Extract annotated URLs from inline citations
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

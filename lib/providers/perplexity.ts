import type { GenerateQueriesResult, ScanProvider, SearchResult } from "./types"

const PERPLEXITY_BASE = "https://api.perplexity.ai/chat/completions"

async function perplexityChat(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  options?: Record<string, unknown>,
): Promise<{
  content: string
  citations: string[]
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
}> {
  const res = await fetch(PERPLEXITY_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      ...options,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Perplexity API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const choice = data.choices?.[0]

  return {
    content: choice?.message?.content || "",
    citations: data.citations || [],
    usage: data.usage || null,
  }
}

export function createPerplexityProvider(apiKey: string): ScanProvider {
  return {
    name: "perplexity",

    async generateQueries(content: string, count: number): Promise<GenerateQueriesResult> {
      const result = await perplexityChat(apiKey, "sonar", [
        {
          role: "system",
          content:
            "You are a query generation assistant. Your ONLY job is to read the provided business content and generate realistic search queries based on what that business actually does. Do NOT search the web. Do NOT use any examples from the prompt as actual queries. Focus entirely on the content provided.",
        },
        {
          role: "user",
          content: `Based on the following business content, generate ${count} realistic questions that a potential customer might ask an AI assistant when looking for these kinds of services.

CRITICAL RULES:
- Do NOT mention the business name, brand name, product names, or any proprietary terms from the content
- These should be generic queries from someone who does NOT know this business exists yet
- Think about what problem the customer has, not what solution this business offers
- Mix broad category queries with specific problem-based queries
- Include location-specific queries where relevant based on the business's actual location
- Base ALL queries strictly on the content below — do not generate queries about unrelated topics

Return a JSON array of strings only, no other text.

Content:
${content}`,
        },
      ])

      // Strip citation markers like [1], [2] that Perplexity embeds in responses
      const cleaned = result.content.replace(/\[\d+\]/g, "")
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error("Failed to parse query list from model response")

      const tokenUsage = result.usage
        ? {
            inputTokens: result.usage.prompt_tokens,
            outputTokens: result.usage.completion_tokens,
            totalTokens: result.usage.total_tokens,
          }
        : null

      return { queries: JSON.parse(jsonMatch[0]), tokenUsage }
    },

    async search(query: string): Promise<SearchResult> {
      const result = await perplexityChat(apiKey, "sonar", [
        {
          role: "user",
          content: query,
        },
      ])

      const sources: Array<{ url: string; title: string }> = result.citations.map((url: string) => ({
        url,
        title: "",
      }))

      const tokenUsage = result.usage
        ? {
            inputTokens: result.usage.prompt_tokens,
            outputTokens: result.usage.completion_tokens,
            totalTokens: result.usage.total_tokens,
          }
        : null

      return {
        response: result.content,
        sources,
        searchQueries: [query],
        tokenUsage,
      }
    },
  }
}

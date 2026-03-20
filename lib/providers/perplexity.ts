import type { ScanProvider, SearchResult } from "./types"

const PERPLEXITY_BASE = "https://api.perplexity.ai/chat/completions"

async function perplexityChat(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
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

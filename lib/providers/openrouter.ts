import type { ScanProvider, SearchResult } from "./types"

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions"

// Models for grounded search (must support web search with citations)
const SEARCH_MODELS: Record<string, string> = {
  "perplexity-sonar": "perplexity/sonar",
  "perplexity-sonar-pro": "perplexity/sonar-pro",
}

async function openRouterChat(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
): Promise<{
  content: string
  citations: string[]
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
}> {
  const res = await fetch(OPENROUTER_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://doesairankme.com",
      "X-Title": "Does AI Rank Me",
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const choice = data.choices?.[0]

  return {
    content: choice?.message?.content || "",
    citations: data.citations || [],
    usage: data.usage || null,
  }
}

export function createOpenRouterProvider(apiKey: string, searchModel = "perplexity-sonar"): ScanProvider {
  const resolvedSearchModel = SEARCH_MODELS[searchModel] || SEARCH_MODELS["perplexity-sonar"]

  return {
    name: `openrouter:${searchModel}`,

    async search(query: string): Promise<SearchResult> {
      const result = await openRouterChat(apiKey, resolvedSearchModel, [
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

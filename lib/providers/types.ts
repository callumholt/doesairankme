export interface GenerateQueriesResult {
  queries: string[]
  tokenUsage: TokenUsage | null
}

export interface ScanProvider {
  name: string
  generateQueries(content: string, count: number): Promise<GenerateQueriesResult>
  search(query: string): Promise<SearchResult>
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface SearchResult {
  response: string
  sources: Array<{ url: string; title: string }>
  searchQueries: string[]
  tokenUsage: TokenUsage | null
}

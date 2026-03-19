export interface ScanProvider {
  name: string
  generateQueries(content: string, count: number): Promise<string[]>
  search(query: string): Promise<SearchResult>
}

export interface SearchResult {
  response: string
  sources: Array<{ url: string; title: string }>
  searchQueries: string[]
}

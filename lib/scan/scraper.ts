async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 doesairankme/1.0" },
    })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function scrapeContent(url: string): Promise<{ source: string; content: string }> {
  const origin = new URL(url).origin
  const llmsTxtUrl = `${origin}/llms.txt`

  // Try llms.txt first
  try {
    const res = await fetchWithTimeout(llmsTxtUrl)
    if (res.ok) {
      const text = await res.text()
      if (text.length > 100) {
        return { source: "llms.txt", content: text.slice(0, 4000) }
      }
    }
  } catch {
    // Fall through to HTML
  }

  // Fall back to HTML
  try {
    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    const text = stripHtml(html)
    return { source: "html", content: text.slice(0, 4000) }
  } catch (err) {
    throw new Error(`Failed to scrape ${url}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

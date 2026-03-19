const USER_AGENT = "Mozilla/5.0 doesairankme/1.0"
const TIMEOUT_MS = 10000

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

export type LlmsTxtResult = {
  exists: boolean
  contentLength: number | null
}

export async function checkLlmsTxt(url: string): Promise<LlmsTxtResult> {
  const origin = new URL(url).origin
  const llmsUrl = `${origin}/llms.txt`

  try {
    const res = await fetchWithTimeout(llmsUrl)
    if (!res.ok) {
      return { exists: false, contentLength: null }
    }
    const text = await res.text()
    return { exists: true, contentLength: text.length }
  } catch {
    return { exists: false, contentLength: null }
  }
}

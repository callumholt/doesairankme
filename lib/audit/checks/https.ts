const USER_AGENT = "Mozilla/5.0 doesairankme/1.0"
const TIMEOUT_MS = 10000

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      ...options,
    })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

export type HttpsResult = {
  isHttps: boolean
  httpRedirects: boolean
}

export async function checkHttps(url: string): Promise<HttpsResult> {
  const parsed = new URL(url)
  const isHttps = parsed.protocol === "https:"

  if (!isHttps) {
    return { isHttps: false, httpRedirects: false }
  }

  // The URL is already HTTPS — check if the HTTP version redirects to HTTPS
  const httpUrl = url.replace(/^https:/, "http:")

  try {
    // Fetch without following redirects to see if it redirects
    const res = await fetchWithTimeout(httpUrl, { redirect: "manual" })
    const location = res.headers.get("location") ?? ""
    const httpRedirects = res.status >= 301 && res.status <= 308 && location.startsWith("https://")
    return { isHttps: true, httpRedirects }
  } catch {
    // Can't reach HTTP — treat as not redirecting
    return { isHttps: true, httpRedirects: false }
  }
}

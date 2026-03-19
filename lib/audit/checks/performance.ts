const USER_AGENT = "Mozilla/5.0 doesairankme/1.0"
const TIMEOUT_MS = 10000

export type PerformanceResult = {
  responseTimeMs: number
  statusCode: number
  htmlSizeBytes: number
  isUnder100KB: boolean
}

export async function checkPerformance(url: string): Promise<PerformanceResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const start = Date.now()

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    })
    clearTimeout(timer)

    const responseTimeMs = Date.now() - start
    const statusCode = res.status
    const html = await res.text()
    const htmlSizeBytes = new TextEncoder().encode(html).length
    const isUnder100KB = htmlSizeBytes < 100 * 1024

    return { responseTimeMs, statusCode, htmlSizeBytes, isUnder100KB }
  } catch {
    clearTimeout(timer)
    const responseTimeMs = Date.now() - start
    return {
      responseTimeMs,
      statusCode: 0,
      htmlSizeBytes: 0,
      isUnder100KB: false,
    }
  }
}

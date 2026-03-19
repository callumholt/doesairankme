import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { getDb } from "@/lib/db/client"
import { scanResults, scans } from "@/lib/db/schema"
import { getProvider } from "@/lib/providers"
import { calculateScore } from "./scoring"
import { scrapeContent } from "./scraper"

/**
 * Extracts the sentence or paragraph from a response text that contains a
 * reference to the target domain. Returns null if the domain is not mentioned.
 */
function extractCitedSnippet(responseText: string, targetDomain: string): string | null {
  if (!responseText) return null

  // Split on sentence boundaries (. ! ?) or paragraph breaks
  const segments = responseText.split(/(?<=[.!?])\s+|\n{2,}/)

  for (const segment of segments) {
    const lower = segment.toLowerCase()
    if (lower.includes(targetDomain.toLowerCase())) {
      const trimmed = segment.trim()
      // Cap at 500 chars to keep the snippet focused
      return trimmed.length > 500 ? `${trimmed.slice(0, 497)}...` : trimmed
    }
  }

  return null
}

export async function runScan(scanId: string) {
  const db = getDb()

  try {
    const scan = await db.query.scans.findFirst({
      where: eq(scans.id, scanId),
    })
    if (!scan) throw new Error("Scan not found")

    const provider = getProvider(scan.provider)
    const targetDomain = new URL(scan.url).hostname.replace(/^www\./, "")

    // Step 1: Scrape
    await db.update(scans).set({ status: "scraping" }).where(eq(scans.id, scanId))
    const { source, content } = await scrapeContent(scan.url)

    // Step 2: Generate queries
    await db.update(scans).set({ status: "generating", contentSource: source }).where(eq(scans.id, scanId))
    const queries = await provider.generateQueries(content, scan.queryCount)

    // Step 3: Search
    await db.update(scans).set({ status: "searching" }).where(eq(scans.id, scanId))

    const results: Array<{ position: number | null; query: string }> = []
    let scanTotalTokens = 0

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]

      try {
        const result = await provider.search(query)

        // Find target domain position
        let position: number | null = null
        for (let j = 0; j < result.sources.length; j++) {
          try {
            const sourceHost = new URL(result.sources[j].url).hostname.replace(/^www\./, "")
            if (sourceHost === targetDomain || sourceHost.endsWith(`.${targetDomain}`)) {
              position = j + 1
              break
            }
          } catch {
            // Skip malformed URLs
          }
        }

        if (result.tokenUsage) {
          scanTotalTokens += result.tokenUsage.totalTokens
        }

        // Extract the sentence/paragraph containing the domain mention
        const citedSnippet = extractCitedSnippet(result.response, targetDomain)

        await db.insert(scanResults).values({
          id: nanoid(),
          scanId,
          query,
          position,
          sources: result.sources,
          searchQueries: result.searchQueries,
          responseSnippet: result.response.slice(0, 500),
          responseText: result.response,
          citedSnippet,
          inputTokens: result.tokenUsage?.inputTokens ?? null,
          outputTokens: result.tokenUsage?.outputTokens ?? null,
          totalTokens: result.tokenUsage?.totalTokens ?? null,
        })

        results.push({ position, query })
      } catch (err) {
        await db.insert(scanResults).values({
          id: nanoid(),
          scanId,
          query,
          position: null,
          sources: [],
          searchQueries: [],
          error: err instanceof Error ? err.message : String(err),
        })

        results.push({ position: null, query })
      }

      // Rate limit delay (skip after last query)
      if (i < queries.length - 1) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    }

    // Step 4: Calculate score
    const scoring = calculateScore(results)

    await db
      .update(scans)
      .set({
        status: "complete",
        score: scoring.score,
        appearanceRate: scoring.appearanceRate,
        avgPosition: scoring.avgPosition,
        totalTokens: scanTotalTokens,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId))
  } catch (err) {
    await db
      .update(scans)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(scans.id, scanId))
  }
}

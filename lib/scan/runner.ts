import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { runAudit } from "@/lib/audit"
import { getDb } from "@/lib/db/client"
import { scanResults, scans, siteAudits } from "@/lib/db/schema"
import { getProvider } from "@/lib/providers"
import { calculateScore } from "./scoring"
import { scrapeContent } from "./scraper"
import { analyseSentiment } from "./sentiment"

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

    // Step 2: Generate queries + run GEO audit in parallel
    await db.update(scans).set({ status: "generating", contentSource: source }).where(eq(scans.id, scanId))
    const [queries, auditResults] = await Promise.all([
      provider.generateQueries(content, scan.queryCount),
      runAudit(scan.url).catch(() => null),
    ])

    // Step 3: Search
    await db.update(scans).set({ status: "searching" }).where(eq(scans.id, scanId))

    const results: Array<{ position: number | null; query: string }> = []
    let scanTotalTokens = 0

    // Track pending sentiment analysis tasks to run in the background
    const sentimentTasks: Array<Promise<void>> = []

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

        const resultId = nanoid()

        await db.insert(scanResults).values({
          id: resultId,
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

        // Run sentiment analysis in the background (parallel with next query)
        // If domain was not found, skip API call and set not_mentioned directly
        const sentimentTask = (async () => {
          try {
            const sentimentResult =
              position === null
                ? {
                    sentiment: "not_mentioned" as const,
                    confidence: 1,
                    summary: "",
                    concerns: [] as string[],
                  }
                : await analyseSentiment(result.response, targetDomain)
            await db
              .update(scanResults)
              .set({
                sentiment: sentimentResult.sentiment,
                sentimentConfidence: sentimentResult.confidence,
                sentimentSummary: sentimentResult.summary || null,
                sentimentConcerns: sentimentResult.concerns.length > 0 ? sentimentResult.concerns : null,
              })
              .where(eq(scanResults.id, resultId))
          } catch {
            // Sentiment failures must never break a scan
          }
        })()

        sentimentTasks.push(sentimentTask)
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
          sentiment: "not_mentioned",
          sentimentConfidence: 1,
        })

        results.push({ position: null, query })
      }

      // Rate limit delay (skip after last query)
      if (i < queries.length - 1) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    }

    // Wait for any remaining sentiment tasks to complete before finalising
    await Promise.allSettled(sentimentTasks)

    // Step 4: Calculate score and persist audit
    const scoring = calculateScore(results)

    const updateScan = db
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

    const insertAudit = auditResults
      ? db.insert(siteAudits).values({
          id: nanoid(),
          scanId,
          url: scan.url,
          domain: scan.domain,
          userId: scan.userId ?? null,
          overallScore: auditResults.overallScore,
          results: auditResults,
        })
      : Promise.resolve()

    await Promise.all([updateScan, insertAudit])
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

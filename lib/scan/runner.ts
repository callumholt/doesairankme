import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { runAudit } from "@/lib/audit"
import { getDb } from "@/lib/db/client"
import { scanResults, scans, siteAudits } from "@/lib/db/schema"
import { getProvider } from "@/lib/providers"
import { generateQueries } from "./generate-queries"
import { calculateScore } from "./scoring"
import { scrapeContent } from "./scraper"
import { analyseSentiment } from "./sentiment"

/**
 * Extracts the sentence or paragraph from a response text that contains a
 * reference to the target domain. Returns null if the domain is not mentioned.
 */
function extractCitedSnippet(responseText: string, targetDomain: string): string | null {
  if (!responseText) return null

  const segments = responseText.split(/(?<=[.!?])\s+|\n{2,}/)

  for (const segment of segments) {
    const lower = segment.toLowerCase()
    if (lower.includes(targetDomain.toLowerCase())) {
      const trimmed = segment.trim()
      return trimmed.length > 500 ? `${trimmed.slice(0, 497)}...` : trimmed
    }
  }

  return null
}

/**
 * Runs a single provider's search phase using pre-generated queries.
 * This is the core of each scan -- it tests queries against the provider
 * and records results.
 */
async function runProviderScan(
  scanId: string,
  providerName: string,
  queries: string[],
  targetDomain: string,
  contentSource: string,
  queryGenTokens: number,
) {
  const db = getDb()

  try {
    const provider = getProvider(providerName)

    await db.update(scans).set({ status: "searching", contentSource }).where(eq(scans.id, scanId))

    const results: Array<{ position: number | null; query: string }> = []
    let scanTotalTokens = 0
    let sentimentTotalTokens = 0
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

        // Run sentiment analysis in background
        const sentimentTask = (async () => {
          try {
            const sentimentResult =
              position === null
                ? {
                    sentiment: "not_mentioned" as const,
                    confidence: 1,
                    summary: "",
                    concerns: [] as string[],
                    totalTokens: 0,
                  }
                : await analyseSentiment(result.response, targetDomain)
            sentimentTotalTokens += sentimentResult.totalTokens
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

    await Promise.allSettled(sentimentTasks)

    const scoring = calculateScore(results)

    await db
      .update(scans)
      .set({
        status: "complete",
        score: scoring.score,
        appearanceRate: scoring.appearanceRate,
        avgPosition: scoring.avgPosition,
        totalTokens: scanTotalTokens,
        queryGenTokens,
        sentimentTokens: sentimentTotalTokens,
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

/**
 * Runs a complete scan: scrape, generate queries, then test each provider.
 * For multi-provider scans, all providers receive the same queries.
 * The audit runs once and is attached to the first scan.
 */
export async function runScanGroup(scanIds: string[]) {
  const db = getDb()

  // Load the first scan to get shared config (url, queryCount)
  const firstScan = await db.query.scans.findFirst({
    where: eq(scans.id, scanIds[0]),
  })
  if (!firstScan) throw new Error("Scan not found")

  const targetDomain = new URL(firstScan.url).hostname.replace(/^www\./, "")

  // Step 1: Scrape (once)
  for (const id of scanIds) {
    await db.update(scans).set({ status: "scraping" }).where(eq(scans.id, id))
  }
  const { source, content } = await scrapeContent(firstScan.url)

  // Step 2: Generate queries (once) + run audit (once), in parallel
  for (const id of scanIds) {
    await db.update(scans).set({ status: "generating", contentSource: source }).where(eq(scans.id, id))
  }

  const [queryGenResult, auditResults] = await Promise.all([
    generateQueries(content, firstScan.queryCount),
    runAudit(firstScan.url).catch(() => null),
  ])

  const queries = queryGenResult.queries
  const queryGenTokens = queryGenResult.tokenUsage?.totalTokens ?? 0

  // Persist audit once (attached to first scan)
  if (auditResults) {
    await db.insert(siteAudits).values({
      id: nanoid(),
      scanId: scanIds[0],
      url: firstScan.url,
      domain: firstScan.domain,
      userId: firstScan.userId ?? null,
      overallScore: auditResults.overallScore,
      results: auditResults,
    })
  }

  // Step 3: Load all scans and run each provider in parallel
  const allScans = await Promise.all(scanIds.map((id) => db.query.scans.findFirst({ where: eq(scans.id, id) })))

  await Promise.all(
    allScans
      .filter((s) => s != null)
      .map((scan) => runProviderScan(scan.id, scan.provider, queries, targetDomain, source, queryGenTokens)),
  )
}

import { type ContentStructureResult, checkContentStructure } from "./checks/content-structure"
import { checkHttps, type HttpsResult } from "./checks/https"
import { checkLlmsTxt, type LlmsTxtResult } from "./checks/llms-txt"
import { checkMetaTags, type MetaTagsResult } from "./checks/meta-tags"
import { checkPerformance, type PerformanceResult } from "./checks/performance"
import { checkRobots, type RobotsResult } from "./checks/robots"
import { checkSchema, type SchemaResult } from "./checks/schema"

const USER_AGENT = "Mozilla/5.0 doesairankme/1.0"
const TIMEOUT_MS = 10000

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return await res.text()
  } catch {
    clearTimeout(timer)
    return null
  }
}

export type AuditResults = {
  robots: RobotsResult
  llmsTxt: LlmsTxtResult
  schema: SchemaResult
  https: HttpsResult
  contentStructure: ContentStructureResult
  metaTags: MetaTagsResult
  performance: PerformanceResult
  overallScore: number
}

/**
 * Calculate the overall site health score (0–100).
 *
 * Scoring breakdown:
 * - robots.txt allows AI bots: 20 points
 * - llms.txt exists: 10 points
 * - Has schema markup: 15 points
 * - HTTPS: 10 points
 * - Good content structure: 15 points
 * - Meta tags complete: 15 points
 * - Good performance: 15 points
 */
function calculateOverallScore(results: Omit<AuditResults, "overallScore">): number {
  let score = 0

  // robots.txt: 20 points — all AI bots allowed
  const aiBots = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "ChatGPT-User"]
  if (results.robots.exists) {
    const allAllowed = aiBots.every((bot) => {
      const found = results.robots.bots.find((b) => b.name === bot)
      return found ? found.allowed : true
    })
    score += allAllowed ? 20 : 10
  }
  // If robots.txt doesn't exist, bots are allowed by default — award partial credit
  if (!results.robots.exists) {
    score += 15
  }

  // llms.txt: 10 points
  if (results.llmsTxt.exists) score += 10

  // Schema markup: 15 points
  if (results.schema.hasSchema) {
    score += results.schema.hasSameAs ? 15 : 10
  }

  // HTTPS: 10 points
  if (results.https.isHttps) {
    score += results.https.httpRedirects ? 10 : 7
  }

  // Content structure: 15 points
  {
    let contentPoints = 0
    if (results.contentStructure.hasProperHierarchy) contentPoints += 6
    if (results.contentStructure.headings.h2 > 0) contentPoints += 3
    if (results.contentStructure.listCount > 0) contentPoints += 3
    if (results.contentStructure.hasFaq) contentPoints += 3
    score += Math.min(contentPoints, 15)
  }

  // Meta tags: 15 points
  {
    let metaPoints = 0
    if (results.metaTags.title.isOptimal) metaPoints += 4
    else if (results.metaTags.title.value) metaPoints += 2
    if (results.metaTags.description.isOptimal) metaPoints += 4
    else if (results.metaTags.description.value) metaPoints += 2
    if (results.metaTags.hasOgTags) metaPoints += 4
    if (results.metaTags.hasCanonical) metaPoints += 3
    score += Math.min(metaPoints, 15)
  }

  // Performance: 15 points
  {
    let perfPoints = 0
    if (results.performance.statusCode >= 200 && results.performance.statusCode < 300) {
      perfPoints += 5
    }
    if (results.performance.responseTimeMs < 3000) perfPoints += 5
    else if (results.performance.responseTimeMs < 6000) perfPoints += 2
    if (results.performance.isUnder100KB) perfPoints += 5
    score += Math.min(perfPoints, 15)
  }

  return Math.min(Math.round(score), 100)
}

export async function runAudit(url: string): Promise<AuditResults> {
  // Fetch HTML once and reuse for HTML-based checks
  const htmlPromise = fetchHtml(url)

  // Run all checks in parallel
  const [html, robots, llmsTxt, https_, performance] = await Promise.all([
    htmlPromise,
    checkRobots(url),
    checkLlmsTxt(url),
    checkHttps(url),
    checkPerformance(url),
  ])

  const emptyHtml = html ?? ""
  const schema = checkSchema(emptyHtml)
  const contentStructure = checkContentStructure(emptyHtml)
  const metaTags = checkMetaTags(emptyHtml)

  const partial = { robots, llmsTxt, schema, https: https_, contentStructure, metaTags, performance }
  const overallScore = calculateOverallScore(partial)

  return { ...partial, overallScore }
}

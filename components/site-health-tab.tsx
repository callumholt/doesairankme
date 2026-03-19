"use client"

import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { AuditResults } from "@/lib/audit"
import type { Recommendation } from "@/lib/audit/recommendations"
import type { SiteAudit } from "@/lib/db/schema"

type CheckStatus = "pass" | "warn" | "fail"

type CheckDisplay = {
  name: string
  status: CheckStatus
  summary: string
  fix: string | null
}

type RecommendationFilter = "all" | "critical" | "important" | "suggestion"

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "pass") return <CheckCircle className="h-5 w-5 text-[#14F0C3] shrink-0" />
  if (status === "warn") return <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
  return <XCircle className="h-5 w-5 text-red-400 shrink-0" />
}

function StatusBadge({ status }: { status: CheckStatus }) {
  if (status === "pass") {
    return <Badge className="bg-[#14F0C3]/10 text-[#14F0C3] border-[#14F0C3]/20 border">Pass</Badge>
  }
  if (status === "warn") {
    return <Badge className="bg-amber-400/10 text-amber-400 border-amber-400/20 border">Warning</Badge>
  }
  return <Badge className="bg-red-400/10 text-red-400 border-red-400/20 border">Fail</Badge>
}

function buildChecks(results: AuditResults): CheckDisplay[] {
  const checks: CheckDisplay[] = []

  // robots.txt
  const aiBots = results.robots.bots.filter((b) =>
    ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "ChatGPT-User"].includes(b.name),
  )
  const blockedBots = aiBots.filter((b) => !b.allowed)

  if (!results.robots.exists) {
    checks.push({
      name: "robots.txt",
      status: "warn",
      summary: "No robots.txt file found. AI crawlers are allowed by default, but adding one is best practice.",
      fix: "Add a robots.txt file to your site root. Explicitly allow GPTBot, ClaudeBot, and PerplexityBot.",
    })
  } else if (blockedBots.length > 0) {
    checks.push({
      name: "robots.txt",
      status: "fail",
      summary: `${blockedBots.length} AI bot${blockedBots.length !== 1 ? "s" : ""} blocked: ${blockedBots.map((b) => b.name).join(", ")}.`,
      fix: `Update your robots.txt to allow these bots, or remove the Disallow: / directive for them.`,
    })
  } else {
    checks.push({
      name: "robots.txt",
      status: "pass",
      summary: "robots.txt exists and all checked AI bots are allowed.",
      fix: null,
    })
  }

  // llms.txt
  if (results.llmsTxt.exists) {
    checks.push({
      name: "llms.txt",
      status: "pass",
      summary: `llms.txt found (${results.llmsTxt.contentLength?.toLocaleString() ?? 0} characters). Helps AI assistants understand your content.`,
      fix: null,
    })
  } else {
    checks.push({
      name: "llms.txt",
      status: "warn",
      summary: "No llms.txt file found. This emerging standard helps AI assistants index your content more accurately.",
      fix: "Create an /llms.txt file describing your site's purpose, key pages, and how AI assistants should represent your brand.",
    })
  }

  // Schema markup
  if (results.schema.hasSchema) {
    const typesStr = results.schema.types.join(", ")
    checks.push({
      name: "Structured data",
      status: results.schema.hasSameAs ? "pass" : "warn",
      summary: `Schema markup found: ${typesStr}.${results.schema.hasSameAs ? " Includes sameAs links." : " No sameAs links found."}`,
      fix: results.schema.hasSameAs
        ? null
        : "Add sameAs links to your Organisation schema to connect your entity to authoritative sources (Wikipedia, Wikidata, social profiles).",
    })
  } else {
    checks.push({
      name: "Structured data",
      status: "fail",
      summary: "No JSON-LD structured data found. Schema markup helps AI assistants understand your entity.",
      fix: "Add Organisation or WebSite schema markup with JSON-LD. Include your name, description, url, and sameAs links.",
    })
  }

  // HTTPS
  if (results.https.isHttps) {
    checks.push({
      name: "HTTPS",
      status: results.https.httpRedirects ? "pass" : "warn",
      summary: results.https.httpRedirects
        ? "Site uses HTTPS and HTTP redirects to HTTPS."
        : "Site uses HTTPS, but HTTP does not redirect to HTTPS.",
      fix: results.https.httpRedirects
        ? null
        : "Configure your server to redirect HTTP traffic to HTTPS (301 redirect).",
    })
  } else {
    checks.push({
      name: "HTTPS",
      status: "fail",
      summary: "Site is not served over HTTPS. This affects trust and crawlability.",
      fix: "Enable HTTPS on your server using a certificate from Let's Encrypt or your hosting provider.",
    })
  }

  // Content structure
  const cs = results.contentStructure
  const structureIssues: string[] = []
  if (cs.headings.h1 === 0) structureIssues.push("no H1 heading")
  if (cs.headings.h1 > 1) structureIssues.push(`${cs.headings.h1} H1 headings (should be 1)`)
  if (cs.headings.h2 === 0) structureIssues.push("no H2 headings")

  if (structureIssues.length === 0) {
    checks.push({
      name: "Content structure",
      status: "pass",
      summary: `Good heading hierarchy. H1: ${cs.headings.h1}, H2: ${cs.headings.h2}, H3: ${cs.headings.h3}. ${cs.listCount} list${cs.listCount !== 1 ? "s" : ""}, ${cs.tableCount} table${cs.tableCount !== 1 ? "s" : ""}.`,
      fix: null,
    })
  } else {
    checks.push({
      name: "Content structure",
      status: cs.headings.h1 === 0 ? "fail" : "warn",
      summary: `Heading structure issues: ${structureIssues.join("; ")}.`,
      fix: "Use a single H1 per page for the main topic, then H2 for sections and H3 for subsections.",
    })
  }

  // Meta tags
  const mt = results.metaTags
  const metaIssues: string[] = []
  if (!mt.title.value) metaIssues.push("missing title")
  else if (!mt.title.isOptimal) metaIssues.push(`title length ${mt.title.length} (ideal: 30–60 chars)`)
  if (!mt.description.value) metaIssues.push("missing meta description")
  else if (!mt.description.isOptimal)
    metaIssues.push(`description length ${mt.description.length} (ideal: 70–155 chars)`)
  if (!mt.hasOgTags) metaIssues.push("missing Open Graph tags")
  if (!mt.hasCanonical) metaIssues.push("missing canonical link")

  if (metaIssues.length === 0) {
    checks.push({
      name: "Meta tags",
      status: "pass",
      summary: "Title, description, Open Graph tags, and canonical link are all present and well-formed.",
      fix: null,
    })
  } else {
    checks.push({
      name: "Meta tags",
      status: metaIssues.length >= 3 ? "fail" : "warn",
      summary: `Meta tag issues: ${metaIssues.join("; ")}.`,
      fix: "Ensure each page has a unique title (30–60 chars), meta description (70–155 chars), og:title, og:description, og:image, and a canonical URL.",
    })
  }

  // Performance
  const perf = results.performance
  const perfIssues: string[] = []
  if (perf.responseTimeMs >= 6000) perfIssues.push(`slow response time (${perf.responseTimeMs}ms)`)
  else if (perf.responseTimeMs >= 3000) perfIssues.push(`response time could be faster (${perf.responseTimeMs}ms)`)
  if (!perf.isUnder100KB) perfIssues.push(`large HTML size (${Math.round(perf.htmlSizeBytes / 1024)}KB)`)
  if (perf.statusCode === 0) perfIssues.push("page unreachable")
  else if (perf.statusCode >= 400) perfIssues.push(`HTTP ${perf.statusCode} error`)

  if (perfIssues.length === 0) {
    checks.push({
      name: "Performance",
      status: "pass",
      summary: `Page loaded in ${perf.responseTimeMs}ms, HTML size ${Math.round(perf.htmlSizeBytes / 1024)}KB.`,
      fix: null,
    })
  } else if (perfIssues.length === 1 && perf.responseTimeMs < 6000 && perf.isUnder100KB) {
    checks.push({
      name: "Performance",
      status: "warn",
      summary: `Minor performance considerations: ${perfIssues.join("; ")}.`,
      fix: "Aim for response times under 3 seconds and HTML payloads under 100KB for optimal crawlability.",
    })
  } else {
    checks.push({
      name: "Performance",
      status: "fail",
      summary: `Performance issues: ${perfIssues.join("; ")}.`,
      fix: "Reduce server response time and HTML payload size. Remove unnecessary scripts and inline styles.",
    })
  }

  return checks
}

function HeroScore({ score }: { score: number }) {
  const isLow = score < 30
  const isMid = score >= 30 && score < 60

  const glowColour = isLow
    ? "shadow-[0_0_60px_-10px_rgba(239,68,68,0.35)]"
    : isMid
      ? "shadow-[0_0_60px_-10px_rgba(245,158,11,0.35)]"
      : "shadow-[0_0_60px_-10px_rgba(20,240,195,0.35)]"

  const textColour = isLow ? "text-red-400" : isMid ? "text-amber-400" : "text-[#14F0C3]"

  const borderColour = isLow ? "border-red-500/20" : isMid ? "border-amber-500/20" : "border-[#14F0C3]/20"

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border ${borderColour} bg-card p-8 ${glowColour}`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Site Health Score</p>
      <span className={`font-mono text-7xl font-bold tabular-nums ${textColour}`}>{score}</span>
      <p className="text-xs text-muted-foreground mt-3 font-mono">/ 100</p>
    </div>
  )
}

function CheckCard({ check }: { check: CheckDisplay }) {
  return (
    <Card className="border-border/50">
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-3">
          <StatusIcon status={check.status} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{check.name}</span>
              <StatusBadge status={check.status} />
            </div>
            <p className="text-sm text-muted-foreground">{check.summary}</p>
            {check.fix && (
              <p className="text-xs text-muted-foreground/60 mt-2 border-l-2 border-border pl-2">{check.fix}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SeverityDot({ severity }: { severity: Recommendation["severity"] }) {
  if (severity === "critical") {
    return <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-400 shrink-0" />
  }
  if (severity === "important") {
    return <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
  }
  return <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-blue-400 shrink-0" />
}

function CategoryBadge({ category }: { category: Recommendation["category"] }) {
  if (category === "technical") {
    return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 border text-xs">Technical</Badge>
  }
  if (category === "content") {
    return <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 border text-xs">Content</Badge>
  }
  return <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 border text-xs">Off-site</Badge>
}

function RecommendationCard({
  rec,
  completed,
  onToggle,
}: {
  rec: Recommendation
  completed: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={`border-border/50 transition-opacity ${completed ? "opacity-50" : ""}`}>
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            type="button"
            onClick={onToggle}
            aria-label={completed ? "Mark as incomplete" : "Mark as complete"}
            className={`mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              completed ? "bg-[#14F0C3] border-[#14F0C3]" : "border-border bg-transparent hover:border-muted-foreground"
            }`}
          >
            {completed && (
              <svg viewBox="0 0 12 12" fill="none" className="h-full w-full p-0.5" aria-hidden="true">
                <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <SeverityDot severity={rec.severity} />

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`font-medium text-sm ${completed ? "line-through text-muted-foreground" : ""}`}>
                {rec.title}
              </span>
              <CategoryBadge category={rec.category} />
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>

            {/* Impact callout */}
            <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 mb-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Impact: </span>
                {rec.impact}
              </p>
            </div>

            {/* How to fix — expandable */}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Hide instructions
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  How to fix
                </>
              )}
            </button>

            {expanded && (
              <div className="mt-2 border-l-2 border-border pl-3">
                <pre className="text-xs text-muted-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
                  {rec.howToFix}
                </pre>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecommendationsSection({ recommendations }: { recommendations: Recommendation[] }) {
  const [filter, setFilter] = useState<RecommendationFilter>("all")
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const criticalCount = recommendations.filter((r) => r.severity === "critical").length
  const importantCount = recommendations.filter((r) => r.severity === "important").length
  const suggestionCount = recommendations.filter((r) => r.severity === "suggestion").length

  const filtered = recommendations.filter((r) => {
    if (filter === "all") return true
    if (filter === "suggestion") return r.severity === "suggestion"
    return r.severity === filter
  })

  function toggleCompleted(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filterTabs: { key: RecommendationFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: recommendations.length },
    { key: "critical", label: "Critical", count: criticalCount },
    { key: "important", label: "Important", count: importantCount },
    { key: "suggestion", label: "Suggestions", count: suggestionCount },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recommendations</h2>
        <Badge className="bg-muted text-muted-foreground border-border border font-mono tabular-nums">
          {recommendations.length}
        </Badge>
      </div>

      {/* Summary row */}
      {recommendations.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {criticalCount > 0 && <span className="text-red-400 font-medium">{criticalCount} critical</span>}
          {criticalCount > 0 && importantCount > 0 && <span>, </span>}
          {importantCount > 0 && <span className="text-amber-400 font-medium">{importantCount} important</span>}
          {(criticalCount > 0 || importantCount > 0) && suggestionCount > 0 && <span>, </span>}
          {suggestionCount > 0 && <span className="text-blue-400 font-medium">{suggestionCount} suggestions</span>}
        </p>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors border ${
              filter === tab.key
                ? "bg-foreground/10 border-foreground/20 text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {tab.label}
            <span className="font-mono tabular-nums opacity-60">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Recommendation cards */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No recommendations in this category.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              completed={completed.has(rec.id)}
              onToggle={() => toggleCompleted(rec.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function SiteHealthTab({ scanId, scanComplete }: { scanId: string; scanComplete: boolean }) {
  const [audit, setAudit] = useState<SiteAudit | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!scanComplete) return

    async function fetchAudit() {
      try {
        const res = await fetch(`/api/scans/${scanId}/audit`)
        if (res.status === 404) {
          // Audit not ready yet — retry shortly
          setTimeout(fetchAudit, 2000)
          return
        }
        if (!res.ok) {
          setError("Failed to load site health audit")
          setIsLoading(false)
          return
        }
        const data = await res.json()
        setAudit(data)
        setRecommendations(data.recommendations ?? [])
        setIsLoading(false)
      } catch {
        setError("Network error loading audit")
        setIsLoading(false)
      }
    }

    fetchAudit()
  }, [scanId, scanComplete])

  if (!scanComplete) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm font-mono">
          Site health audit will be available once the scan completes.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#14F0C3] animate-pulse" />
          <p className="text-muted-foreground font-mono text-sm">Loading site health audit...</p>
        </div>
      </div>
    )
  }

  if (error || !audit) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive text-sm">{error ?? "Audit not found"}</p>
      </div>
    )
  }

  const results = audit.results as AuditResults
  const checks = buildChecks(results)
  const passCount = checks.filter((c) => c.status === "pass").length
  const warnCount = checks.filter((c) => c.status === "warn").length
  const failCount = checks.filter((c) => c.status === "fail").length

  return (
    <div className="space-y-6">
      <HeroScore score={audit.overallScore} />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-[#14F0C3]/10 bg-[#14F0C3]/[0.02] p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Passed</p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-[#14F0C3]">{passCount}</p>
        </div>
        <div className="rounded-lg border border-amber-500/10 bg-amber-500/[0.02] p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Warnings</p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-amber-400">{warnCount}</p>
        </div>
        <div className="rounded-lg border border-red-500/10 bg-red-500/[0.02] p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-red-400">{failCount}</p>
        </div>
      </div>

      {/* Check cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Checks</h2>
        {checks.map((check) => (
          <CheckCard key={check.name} check={check} />
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && <RecommendationsSection recommendations={recommendations} />}
    </div>
  )
}

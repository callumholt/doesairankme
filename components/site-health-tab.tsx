"use client"

import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { AuditResults } from "@/lib/audit"
import type { SiteAudit } from "@/lib/db/schema"

type CheckStatus = "pass" | "warn" | "fail"

type CheckDisplay = {
  name: string
  status: CheckStatus
  summary: string
  fix: string | null
}

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

export function SiteHealthTab({ scanId, scanComplete }: { scanId: string; scanComplete: boolean }) {
  const [audit, setAudit] = useState<SiteAudit | null>(null)
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
    </div>
  )
}

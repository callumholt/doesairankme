"use client"

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  XCircle,
} from "lucide-react"
import { useParams } from "next/navigation"
import { useState } from "react"
import { ScanProgress } from "@/components/scan-progress"
import { ScoreBadge } from "@/components/score-badge"
import { SiteHealthTab } from "@/components/site-health-tab"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGroupPolling } from "@/hooks/use-group-polling"
import type { Scan, ScanResult } from "@/lib/db/schema"

type ScanWithResults = Scan & { results: ScanResult[] }

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Gemini",
  openai: "OpenAI",
  perplexity: "Perplexity",
  "perplexity-sonar": "Perplexity Sonar",
  "perplexity-sonar-pro": "Perplexity Sonar Pro",
}

/** Extract a readable short label from a URL: "example.com/blog/post" */
function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "")
    const path = u.pathname === "/" ? "" : u.pathname
    const short = host + path
    return short.length > 45 ? `${short.slice(0, 42)}...` : short
  } catch {
    return url.length > 45 ? `${url.slice(0, 42)}...` : url
  }
}

function ProviderScoreCard({ scan }: { scan: ScanWithResults }) {
  const isRunning = !["complete", "failed"].includes(scan.status)
  const label = PROVIDER_LABELS[scan.provider] || scan.provider

  if (scan.status === "failed") {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/[0.02] p-5 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <p className="text-sm text-red-400 font-mono">Failed</p>
      </div>
    )
  }

  if (isRunning) {
    return (
      <div className="rounded-lg border border-primary/10 bg-primary/[0.02] p-5 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-mono text-muted-foreground">{scan.status}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-primary/10 bg-primary/[0.02] p-5 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
      <ScoreBadge score={scan.score} />
      <p className="text-xs text-muted-foreground mt-3 font-mono">
        {scan.appearanceRate !== null ? `${Math.round(scan.appearanceRate * 100)}%` : "-"} found
      </p>
    </div>
  )
}

function PositionBadge({ position }: { position: number | null }) {
  if (position !== null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5">
        <CheckCircle2 className="h-3 w-3 text-primary" />
        <span className="font-mono font-bold text-xs tabular-nums text-primary">#{position}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 border border-border/50 px-2.5 py-0.5">
      <XCircle className="h-3 w-3 text-muted-foreground/40" />
      <span className="font-mono text-xs text-muted-foreground/40">n/a</span>
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment: ScanResult["sentiment"] }) {
  if (!sentiment || sentiment === "not_mentioned") return null

  if (sentiment === "positive") {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
      >
        Positive
      </Badge>
    )
  }
  if (sentiment === "negative") {
    return (
      <Badge variant="secondary" className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20">
        Negative
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground border border-border">
      Neutral
    </Badge>
  )
}

function SourcesList({ sources, domain }: { sources: Array<{ url: string; title: string }>; domain: string }) {
  return (
    <ol className="space-y-1">
      {sources.slice(0, 5).map((source, i) => {
        const isTarget = source.url.includes(domain)
        return (
          <li
            key={`source-${source.url}-${source.title}`}
            className={`flex items-center gap-2 text-xs rounded px-2 py-1 ${isTarget ? "bg-primary/10 border border-primary/15" : ""}`}
          >
            <span className="font-mono text-muted-foreground/40 w-4 text-right shrink-0">{i + 1}</span>
            <span className={`truncate ${isTarget ? "font-medium text-primary" : "text-muted-foreground"}`}>
              {source.title || shortenUrl(source.url)}
            </span>
            {isTarget && (
              <Badge
                variant="secondary"
                className="text-[9px] bg-primary/15 text-primary border border-primary/20 shrink-0 ml-auto"
              >
                You
              </Badge>
            )}
          </li>
        )
      })}
      {sources.length > 5 && (
        <li className="text-muted-foreground/40 font-mono text-[10px] pl-6">+{sources.length - 5} more</li>
      )}
    </ol>
  )
}

function ProviderResponsePanel({
  result,
  providerLabel,
  domain,
}: {
  result: ScanResult
  providerLabel: string
  domain: string
}) {
  const [showFullResponse, setShowFullResponse] = useState(false)
  const found = result.position !== null

  return (
    <div
      className={`rounded-xl border p-5 space-y-4 flex flex-col ${
        found ? "border-primary/20 bg-gradient-to-b from-primary/[0.04] to-transparent" : "border-border/30 bg-muted/10"
      }`}
    >
      {/* Provider header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-sm font-semibold tracking-tight">{providerLabel}</span>
          <SentimentBadge sentiment={result.sentiment} />
        </div>
        <PositionBadge position={result.position} />
      </div>

      {/* Response snippet -- always visible, most valuable content */}
      {result.responseSnippet && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{result.responseSnippet}</p>
      )}

      {/* Cited snippet */}
      {result.citedSnippet && (
        <blockquote className="border-l-2 border-primary/40 pl-3 text-xs text-muted-foreground/80 italic leading-relaxed">
          {result.citedSnippet}
        </blockquote>
      )}

      {/* Sentiment summary */}
      {result.sentiment && result.sentiment !== "not_mentioned" && result.sentimentSummary && (
        <p className="text-xs text-muted-foreground/70 italic">{result.sentimentSummary}</p>
      )}

      {/* Concerns */}
      {result.sentimentConcerns && result.sentimentConcerns.length > 0 && (
        <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 mb-1.5 font-medium">
            <AlertTriangle className="h-3 w-3" />
            <span className="uppercase tracking-wider">Concerns</span>
          </div>
          <ul className="space-y-1">
            {result.sentimentConcerns.map((concern) => (
              <li key={concern} className="text-xs text-muted-foreground leading-relaxed">
                {concern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {result.sources && result.sources.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2 font-medium">
            Sources cited
          </p>
          <SourcesList sources={result.sources} domain={domain} />
        </div>
      )}

      {/* Full response toggle -- pushed to bottom */}
      {result.responseText && (
        <div className="mt-auto pt-2 border-t border-border/20">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors group"
            onClick={() => setShowFullResponse((v) => !v)}
          >
            {showFullResponse ? (
              <EyeOff className="h-3 w-3 group-hover:text-primary transition-colors" />
            ) : (
              <Eye className="h-3 w-3 group-hover:text-primary transition-colors" />
            )}
            {showFullResponse ? "Hide full response" : "View full response"}
          </button>
          {showFullResponse && (
            <div className="mt-3 rounded-lg border border-border/30 bg-background/50 p-4 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto font-mono">
              {result.responseText}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ComparisonRow({
  query,
  resultsByProvider,
  groupScans,
  domain,
  index,
}: {
  query: string
  resultsByProvider: Map<string, ScanResult>
  groupScans: ScanWithResults[]
  domain: string
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const hasAnyContent = Array.from(resultsByProvider.values()).some(
    (r) => (r.sources && r.sources.length > 0) || r.responseText,
  )
  const anyFound = Array.from(resultsByProvider.values()).some((r) => r.position !== null)

  return (
    <div className={`${index > 0 ? "border-t border-border/30" : ""}`}>
      {/* Row header */}
      <button
        type="button"
        disabled={!hasAnyContent}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 ${
          hasAnyContent ? "cursor-pointer hover:bg-muted/30" : ""
        } ${expanded ? "bg-muted/20" : ""} ${anyFound ? "" : "opacity-60"}`}
        onClick={() => hasAnyContent && setExpanded(!expanded)}
      >
        <span className="text-muted-foreground/30 w-5 shrink-0">
          {hasAnyContent ? expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" /> : null}
        </span>

        <span className="text-sm flex-1 min-w-0 pr-4">{query}</span>

        <div className="flex items-center gap-6 shrink-0">
          {groupScans.map((scan) => {
            const result = resultsByProvider.get(scan.provider)
            return (
              <div key={scan.id} className="w-20 text-center">
                {result ? (
                  <PositionBadge position={result.position} />
                ) : (
                  <span className="text-muted-foreground/20 text-xs">-</span>
                )}
              </div>
            )
          })}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-5 pt-2 bg-muted/10 border-t border-border/20">
          <div
            className={`grid gap-4 ${
              groupScans.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : groupScans.length === 3
                  ? "grid-cols-1 lg:grid-cols-3"
                  : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {groupScans.map((scan) => {
              const result = resultsByProvider.get(scan.provider)
              if (!result) return null
              return (
                <ProviderResponsePanel
                  key={scan.id}
                  result={result}
                  providerLabel={PROVIDER_LABELS[scan.provider] || scan.provider}
                  domain={domain}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ComparisonTable({ groupScans, domain }: { groupScans: ScanWithResults[]; domain: string }) {
  const queryMap = new Map<string, Map<string, ScanResult>>()

  for (const scan of groupScans) {
    for (const result of scan.results) {
      if (!queryMap.has(result.query)) {
        queryMap.set(result.query, new Map())
      }
      // biome-ignore lint/style/noNonNullAssertion: key is guaranteed to exist from the has() check above
      queryMap.get(result.query)!.set(scan.provider, result)
    }
  }

  const queries = Array.from(queryMap.keys())

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
        <span className="w-5 shrink-0" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium flex-1">Query</span>
        <div className="flex items-center gap-6 shrink-0">
          {groupScans.map((scan) => (
            <div key={scan.id} className="w-20 text-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                {PROVIDER_LABELS[scan.provider] || scan.provider}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      {queries.map((query, i) => (
        <ComparisonRow
          key={query}
          query={query}
          // biome-ignore lint/style/noNonNullAssertion: key comes from queryMap.keys()
          resultsByProvider={queryMap.get(query)!}
          groupScans={groupScans}
          domain={domain}
          index={i}
        />
      ))}
    </div>
  )
}

export function GroupScanDetail() {
  const { groupId } = useParams<{ groupId: string }>()
  const { scans: groupScans, isLoading, error } = useGroupPolling(groupId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <p className="text-muted-foreground font-mono text-sm">Loading scans...</p>
        </div>
      </div>
    )
  }

  if (error || groupScans.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">{error || "Scans not found"}</p>
      </div>
    )
  }

  const domain = groupScans[0].domain
  const allDone = groupScans.every((s) => ["complete", "failed"].includes(s.status))
  const runningScans = groupScans.filter((s) => !["complete", "failed"].includes(s.status))
  const firstCompleteScan = groupScans.find((s) => s.status === "complete")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{domain}</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          Multi-provider scan &mdash; {new Date(groupScans[0].createdAt).toLocaleDateString()}
          &nbsp;&middot;&nbsp;{groupScans.length} providers
        </p>
      </div>

      {/* Provider score cards */}
      <div
        className={`grid gap-4 ${groupScans.length === 2 ? "grid-cols-2" : groupScans.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}
      >
        {groupScans.map((scan) => (
          <ProviderScoreCard key={scan.id} scan={scan} />
        ))}
      </div>

      {/* Progress for running scans */}
      {!allDone && runningScans.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${runningScans.length}, 1fr)` }}>
          {runningScans.map((scan) => (
            <Card key={scan.id} className="border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">{PROVIDER_LABELS[scan.provider] || scan.provider}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScanProgress status={scan.status} resultCount={scan.results.length} queryCount={scan.queryCount} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Failed scans */}
      {groupScans
        .filter((s) => s.status === "failed")
        .map((scan) => (
          <Card key={scan.id} className="border-destructive/50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">
                <span className="font-medium">{PROVIDER_LABELS[scan.provider] || scan.provider}</span> &mdash;{" "}
                {scan.error || "Unknown error"}
              </span>
            </CardContent>
          </Card>
        ))}

      {/* Tabs: AI Visibility + Site Health */}
      {allDone && groupScans.some((s) => s.status === "complete") && (
        <Tabs defaultValue="results">
          <TabsList>
            <TabsTrigger value="results">AI Visibility</TabsTrigger>
            <TabsTrigger value="health">Site Health</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="mt-6 space-y-6">
            <Card className="border-primary/10 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Query Results by Provider</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Click any row to compare how each AI provider responded.
                </p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <ComparisonTable groupScans={groupScans.filter((s) => s.status === "complete")} domain={domain} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            {firstCompleteScan ? (
              <SiteHealthTab scanId={firstCompleteScan.id} scanComplete />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No completed scan available for site health audit.
              </p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

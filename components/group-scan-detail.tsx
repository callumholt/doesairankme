"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Loader2, XCircle } from "lucide-react"
import { useGroupPolling } from "@/hooks/use-group-polling"
import { ScanProgress } from "@/components/scan-progress"
import { ScoreBadge } from "@/components/score-badge"
import { SiteHealthTab } from "@/components/site-health-tab"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Scan, ScanResult } from "@/lib/db/schema"

type ScanWithResults = Scan & { results: ScanResult[] }

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Gemini",
  openai: "OpenAI",
  perplexity: "Perplexity",
  "perplexity-sonar": "Perplexity Sonar",
  "perplexity-sonar-pro": "Perplexity Sonar Pro",
}

function ProviderScoreCard({ scan }: { scan: ScanWithResults }) {
  const isRunning = !["complete", "failed"].includes(scan.status)
  const label = PROVIDER_LABELS[scan.provider] || scan.provider

  if (scan.status === "failed") {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/[0.02] p-4 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <p className="text-sm text-red-400 font-mono">Failed</p>
      </div>
    )
  }

  if (isRunning) {
    return (
      <div className="rounded-lg border border-primary/10 bg-primary/[0.02] p-4 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-mono text-muted-foreground">{scan.status}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-primary/10 bg-primary/[0.02] p-4 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <ScoreBadge score={scan.score} />
      <p className="text-xs text-muted-foreground mt-2 font-mono">
        {scan.appearanceRate !== null ? `${Math.round(scan.appearanceRate * 100)}%` : "-"} found
      </p>
    </div>
  )
}

function PositionCell({ position }: { position: number | null }) {
  if (position !== null) {
    return (
      <span className="inline-flex items-center gap-1 text-primary">
        <CheckCircle2 className="h-3 w-3" />
        <span className="font-mono font-bold text-xs tabular-nums">#{position}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground/30">
      <XCircle className="h-3 w-3" />
      <span className="font-mono text-xs">n/a</span>
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment: ScanResult["sentiment"] }) {
  if (!sentiment || sentiment === "not_mentioned") return null

  if (sentiment === "positive") {
    return (
      <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
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
    <div className={`rounded-lg border p-4 space-y-3 ${found ? "border-primary/20 bg-primary/[0.02]" : "border-border/40 bg-muted/20"}`}>
      {/* Provider header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{providerLabel}</span>
          <SentimentBadge sentiment={result.sentiment} />
        </div>
        <PositionCell position={result.position} />
      </div>

      {/* Cited snippet */}
      {result.citedSnippet && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Cited snippet</p>
          <blockquote className="border-l-2 border-primary/50 pl-3 text-sm text-muted-foreground italic">
            {result.citedSnippet}
          </blockquote>
        </div>
      )}

      {/* Sentiment */}
      {result.sentiment && result.sentiment !== "not_mentioned" && result.sentimentSummary && (
        <p className="text-xs text-muted-foreground">{result.sentimentSummary}</p>
      )}

      {/* Concerns */}
      {result.sentimentConcerns && result.sentimentConcerns.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 mb-1">
            <AlertTriangle className="h-3 w-3" />
            <span className="uppercase tracking-wider">Concerns</span>
          </div>
          <ul className="space-y-0.5">
            {result.sentimentConcerns.map((concern) => (
              <li key={concern} className="text-xs text-muted-foreground border-l-2 border-amber-500/30 pl-2">
                {concern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {result.sources && result.sources.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sources</p>
          <ul className="space-y-1">
            {result.sources.slice(0, 5).map((source, i) => {
              const isTarget = source.url.includes(domain)
              return (
                <li key={`${source.url}-${i}`} className={`text-xs ${isTarget ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  <span className="font-mono text-muted-foreground/50 mr-1.5">{i + 1}.</span>
                  {source.title || source.url}
                  {isTarget && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] bg-primary/15 text-primary border border-primary/20">
                      Your site
                    </Badge>
                  )}
                </li>
              )
            })}
            {result.sources.length > 5 && (
              <li className="text-muted-foreground/50 font-mono text-[10px]">...and {result.sources.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Full response toggle */}
      {result.responseText && (
        <div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            onClick={() => setShowFullResponse((v) => !v)}
          >
            {showFullResponse ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {showFullResponse ? "Hide full response" : "Show full response"}
          </button>
          {showFullResponse && (
            <div className="mt-2 rounded-md border border-border/40 bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
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
}: {
  query: string
  resultsByProvider: Map<string, ScanResult>
  groupScans: ScanWithResults[]
  domain: string
}) {
  const [expanded, setExpanded] = useState(false)
  const hasAnyContent = Array.from(resultsByProvider.values()).some(
    (r) => (r.sources && r.sources.length > 0) || r.responseText,
  )

  return (
    <>
      <TableRow
        className={`transition-colors ${hasAnyContent ? "cursor-pointer" : ""} hover:bg-muted/30`}
        onClick={() => hasAnyContent && setExpanded(!expanded)}
      >
        <TableCell className="w-8 text-muted-foreground/40">
          {hasAnyContent ? (
            expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : null}
        </TableCell>
        <TableCell className="text-sm max-w-md">{query}</TableCell>
        {groupScans.map((scan) => {
          const result = resultsByProvider.get(scan.provider)
          return (
            <TableCell key={scan.id} className="text-center">
              {result ? (
                <PositionCell position={result.position} />
              ) : (
                <span className="text-muted-foreground/20">-</span>
              )}
            </TableCell>
          )
        })}
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/10 hover:bg-muted/10">
          <TableCell />
          <TableCell colSpan={groupScans.length + 1} className="py-4">
            <div className={`grid gap-4 ${groupScans.length === 2 ? "grid-cols-2" : groupScans.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
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
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function ComparisonTable({ groupScans, domain }: { groupScans: ScanWithResults[]; domain: string }) {
  const queryMap = new Map<string, Map<string, ScanResult>>()

  for (const scan of groupScans) {
    for (const result of scan.results) {
      if (!queryMap.has(result.query)) {
        queryMap.set(result.query, new Map())
      }
      queryMap.get(result.query)!.set(scan.provider, result)
    }
  }

  const queries = Array.from(queryMap.keys())

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-primary/10 hover:bg-transparent">
          <TableHead className="w-8" />
          <TableHead className="text-xs uppercase tracking-wider">Query</TableHead>
          {groupScans.map((scan) => (
            <TableHead key={scan.id} className="text-center text-xs uppercase tracking-wider w-28">
              {PROVIDER_LABELS[scan.provider] || scan.provider}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {queries.map((query) => (
          <ComparisonRow
            key={query}
            query={query}
            resultsByProvider={queryMap.get(query)!}
            groupScans={groupScans}
            domain={domain}
          />
        ))}
      </TableBody>
    </Table>
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
  const allComplete = groupScans.every((s) => s.status === "complete")
  const runningScans = groupScans.filter((s) => !["complete", "failed"].includes(s.status))

  // Audit is attached to the first scan in the group
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
                <CardTitle className="text-sm font-mono">
                  {PROVIDER_LABELS[scan.provider] || scan.provider}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScanProgress
                  status={scan.status}
                  resultCount={scan.results.length}
                  queryCount={scan.queryCount}
                />
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
                <span className="font-medium">
                  {PROVIDER_LABELS[scan.provider] || scan.provider}
                </span>{" "}
                &mdash; {scan.error || "Unknown error"}
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

          <TabsContent value="results" className="mt-6">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle>Query Results by Provider</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Click a row to see each provider's full response, sources, and sentiment.
                </p>
              </CardHeader>
              <CardContent>
                <ComparisonTable
                  groupScans={groupScans.filter((s) => s.status === "complete")}
                  domain={domain}
                />
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

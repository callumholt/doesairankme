"use client"

import { useParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useGroupPolling } from "@/hooks/use-group-polling"
import { ScanProgress } from "@/components/scan-progress"
import { ScoreBadge } from "@/components/score-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

function ComparisonTable({ groupScans }: { groupScans: ScanWithResults[] }) {
  // Collect all unique queries across all scans. Queries should be the same
  // since they're generated from the same content, but handle mismatches.
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
          <TableHead className="text-xs uppercase tracking-wider">Query</TableHead>
          {groupScans.map((scan) => (
            <TableHead key={scan.id} className="text-center text-xs uppercase tracking-wider w-28">
              {PROVIDER_LABELS[scan.provider] || scan.provider}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {queries.map((query) => {
          const resultsByProvider = queryMap.get(query)!
          return (
            <TableRow key={query} className="hover:bg-muted/30">
              <TableCell className="text-sm max-w-md">{query}</TableCell>
              {groupScans.map((scan) => {
                const result = resultsByProvider.get(scan.provider)
                return (
                  <TableCell key={scan.id} className="text-center">
                    {result ? <PositionCell position={result.position} /> : <span className="text-muted-foreground/20">-</span>}
                  </TableCell>
                )
              })}
            </TableRow>
          )
        })}
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
  const allComplete = groupScans.every((s) => s.status === "complete")
  const allDone = groupScans.every((s) => ["complete", "failed"].includes(s.status))
  const runningScans = groupScans.filter((s) => !["complete", "failed"].includes(s.status))

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
      <div className={`grid gap-4 ${groupScans.length === 2 ? "grid-cols-2" : groupScans.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
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
      {groupScans.filter((s) => s.status === "failed").map((scan) => (
        <Card key={scan.id} className="border-destructive/50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm">
              <span className="font-medium">{PROVIDER_LABELS[scan.provider] || scan.provider}</span>
              {" "}&mdash; {scan.error || "Unknown error"}
            </span>
          </CardContent>
        </Card>
      ))}

      {/* Comparison table */}
      {allDone && groupScans.some((s) => s.status === "complete") && (
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Query Results by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonTable groupScans={groupScans.filter((s) => s.status === "complete")} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

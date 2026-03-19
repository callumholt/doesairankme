"use client"

import { AlertCircle } from "lucide-react"
import { useParams } from "next/navigation"
import { ResultsTable } from "@/components/results-table"
import { ScanProgress } from "@/components/scan-progress"
import { SiteHealthTab } from "@/components/site-health-tab"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useScanPolling } from "@/hooks/use-scan-polling"
import type { ScanResult } from "@/lib/db/schema"

function HeroScore({ score }: { score: number | null }) {
  if (score === null) return null

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
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">AI Discoverability Score</p>
      <span className={`font-mono text-7xl font-bold tabular-nums ${textColour}`}>{score}</span>
      <p className="text-xs text-muted-foreground mt-3 font-mono">/ 100</p>
    </div>
  )
}

type OverallSentiment = "Mostly Positive" | "Mixed" | "Mostly Negative" | "Not Mentioned"

function calculateOverallSentiment(results: ScanResult[]): OverallSentiment {
  const mentionedResults = results.filter((r) => r.sentiment && r.sentiment !== "not_mentioned")

  if (mentionedResults.length === 0) return "Not Mentioned"

  const counts = { positive: 0, neutral: 0, negative: 0 }
  for (const r of mentionedResults) {
    if (r.sentiment === "positive") counts.positive++
    else if (r.sentiment === "negative") counts.negative++
    else counts.neutral++
  }

  const total = mentionedResults.length
  const positiveRatio = counts.positive / total
  const negativeRatio = counts.negative / total

  if (positiveRatio >= 0.6) return "Mostly Positive"
  if (negativeRatio >= 0.4) return "Mostly Negative"
  return "Mixed"
}

function OverallSentimentCard({ results }: { results: ScanResult[] }) {
  // Only show if at least some results have sentiment data
  const hasSentimentData = results.some((r) => r.sentiment !== null && r.sentiment !== undefined)
  if (!hasSentimentData) return null

  const overallSentiment = calculateOverallSentiment(results)

  const textColour =
    overallSentiment === "Mostly Positive"
      ? "text-emerald-400"
      : overallSentiment === "Mostly Negative"
        ? "text-red-400"
        : overallSentiment === "Mixed"
          ? "text-amber-400"
          : "text-muted-foreground"

  const borderColour =
    overallSentiment === "Mostly Positive"
      ? "border-emerald-500/20 bg-emerald-500/[0.02]"
      : overallSentiment === "Mostly Negative"
        ? "border-red-500/20 bg-red-500/[0.02]"
        : overallSentiment === "Mixed"
          ? "border-amber-500/20 bg-amber-500/[0.02]"
          : "border-muted-foreground/10 bg-muted/[0.02]"

  return (
    <div className={`rounded-lg border ${borderColour} p-4 text-center`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Overall Sentiment</p>
      <p className={`text-2xl font-bold font-mono mt-1 ${textColour}`}>{overallSentiment}</p>
    </div>
  )
}

export function ScanDetail() {
  const { id } = useParams<{ id: string }>()
  const { scan, isLoading, error } = useScanPolling(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#14F0C3] animate-pulse" />
          <p className="text-muted-foreground font-mono text-sm">Loading scan...</p>
        </div>
      </div>
    )
  }

  if (error || !scan) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">{error || "Scan not found"}</p>
      </div>
    )
  }

  const isRunning = !["complete", "failed"].includes(scan.status)

  if (scan.status === "failed") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{scan.domain}</h1>
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Scan failed</p>
              <p className="text-sm text-muted-foreground">{scan.error || "An unknown error occurred"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isRunning) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{scan.domain}</h1>
        <Card className="border-[#14F0C3]/10">
          <CardHeader>
            <CardTitle>Scan in progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ScanProgress status={scan.status} resultCount={scan.results.length} queryCount={scan.queryCount} />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Complete
  const found = scan.results.filter((r) => r.position !== null)
  const missed = scan.results.filter((r) => r.position === null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{scan.domain}</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          Scanned {new Date(scan.createdAt).toLocaleDateString()} via {scan.provider}
          {scan.contentSource && ` (${scan.contentSource})`}
        </p>
      </div>

      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results">AI Visibility</TabsTrigger>
          <TabsTrigger value="health">Site Health</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-8 mt-6">
          {/* Hero score */}
          <HeroScore score={scan.score} />

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-[#14F0C3]/10 bg-[#14F0C3]/[0.02] p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Appearance Rate</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-foreground">
                {scan.appearanceRate !== null ? `${Math.round(scan.appearanceRate * 100)}%` : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-[#14F0C3]/10 bg-[#14F0C3]/[0.02] p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Position</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-foreground">
                {scan.avgPosition !== null ? scan.avgPosition.toFixed(1) : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-[#14F0C3]/10 bg-[#14F0C3]/[0.02] p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Found / Total</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-foreground">
                <span className="text-[#14F0C3]">{found.length}</span>
                <span className="text-muted-foreground mx-1">/</span>
                {scan.results.length}
              </p>
            </div>
          </div>

          {/* Overall sentiment card — spans full width below stats */}
          <OverallSentimentCard results={scan.results} />

          {/* Results table */}
          <Card className="border-[#14F0C3]/10">
            <CardHeader>
              <CardTitle>Query Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsTable results={scan.results} domain={scan.domain} />
            </CardContent>
          </Card>

          {/* Missed queries */}
          {missed.length > 0 && (
            <Card className="border-muted-foreground/10">
              <CardHeader>
                <CardTitle className="text-muted-foreground">
                  Missed Queries <span className="font-mono text-sm">({missed.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {missed.map((r) => (
                    <li key={r.id} className="text-muted-foreground/70 border-l-2 border-red-500/20 pl-3">
                      {r.query}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <SiteHealthTab scanId={id} scanComplete={scan.status === "complete"} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

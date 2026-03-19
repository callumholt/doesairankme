"use client"

import { AlertCircle, ArrowRight, Lock } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ResultsTable } from "@/components/results-table"
import { ScanProgress } from "@/components/scan-progress"
import { SiteHealthTab } from "@/components/site-health-tab"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnonScanPolling } from "@/hooks/use-anon-scan-polling"

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

function SignupGate({ scanId, gatedCount }: { scanId: string; gatedCount: number }) {
  return (
    <div className="relative mt-6">
      {/* Blurred placeholder rows */}
      <div className="space-y-2 select-none pointer-events-none" aria-hidden>
        {Array.from({ length: Math.min(gatedCount, 3) }, (_, i) => `row-${i}`).map((key) => (
          <div
            key={key}
            className="flex items-center gap-4 rounded-lg border border-border/30 bg-card/30 p-4 blur-[6px]"
          >
            <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-3/4 rounded bg-muted-foreground/15" />
              <div className="h-2 w-1/2 rounded bg-muted-foreground/10" />
            </div>
            <div className="h-5 w-10 rounded bg-muted-foreground/15" />
          </div>
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-background via-background/95 to-background/60 rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Lock className="h-4 w-4" />
          <span className="font-mono text-sm">
            {gatedCount} more result{gatedCount !== 1 ? "s" : ""} hidden
          </span>
        </div>
        <p className="text-sm text-muted-foreground/70 mb-5 text-center max-w-sm">
          Create a free account to see all your results, track changes over time, and scan with more AI models.
        </p>
        <div className="flex gap-3">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 glow-teal">
            <Link href={`/signup?redirect=/scans/${scanId}`}>
              Sign up free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-border/60 text-muted-foreground hover:text-foreground">
            <Link href={`/login?redirect=/scans/${scanId}`}>Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AnonScanPage() {
  const { id } = useParams<{ id: string }>()
  const { scan, isLoading, error } = useAnonScanPolling(id)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#14F0C3] animate-pulse" />
            <p className="text-muted-foreground font-mono text-sm">Loading scan...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !scan) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="flex items-center justify-center">
          <p className="text-destructive">{error || "Scan not found"}</p>
        </div>
      </div>
    )
  }

  const isRunning = !["complete", "failed"].includes(scan.status)

  if (scan.status === "failed") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
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
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
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
  const visibleResults = scan.results.filter((r: { gated?: boolean }) => !r.gated)
  const gatedResults = scan.results.filter((r: { gated?: boolean }) => r.gated)

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
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
                <span className="text-[#14F0C3]">?</span>
                <span className="text-muted-foreground mx-1">/</span>
                {scan.results.length}
              </p>
            </div>
          </div>

          {/* Visible results */}
          <Card className="border-[#14F0C3]/10">
            <CardHeader>
              <CardTitle>Query Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsTable results={visibleResults} domain={scan.domain} />
              {gatedResults.length > 0 && <SignupGate scanId={id} gatedCount={gatedResults.length} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <SiteHealthTab scanId={id} scanComplete={scan.status === "complete"} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

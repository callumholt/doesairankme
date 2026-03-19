"use client"

import { useParams } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { useScanPolling } from "@/hooks/use-scan-polling"
import { ScoreBadge } from "@/components/score-badge"
import { ScanProgress } from "@/components/scan-progress"
import { ResultsTable } from "@/components/results-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { scan, isLoading, error } = useScanPolling(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading scan...</p>
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
        <h1 className="text-2xl font-bold">{scan.domain}</h1>
        <Card className="border-destructive">
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
        <h1 className="text-2xl font-bold">{scan.domain}</h1>
        <Card>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{scan.domain}</h1>
          <p className="text-sm text-muted-foreground">
            Scanned {new Date(scan.createdAt).toLocaleDateString()} via {scan.provider}
            {scan.contentSource && ` (${scan.contentSource})`}
          </p>
        </div>
      </div>

      {/* Score header */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Score</p>
            <div className="mt-1">
              <ScoreBadge score={scan.score} className="text-lg px-3 py-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Appearance Rate</p>
            <p className="text-2xl font-bold mt-1">
              {scan.appearanceRate !== null ? `${Math.round(scan.appearanceRate * 100)}%` : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Avg Position</p>
            <p className="text-2xl font-bold mt-1">{scan.avgPosition !== null ? scan.avgPosition.toFixed(1) : "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Found / Total</p>
            <p className="text-2xl font-bold mt-1">
              {found.length} / {scan.results.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results table */}
      <Card>
        <CardHeader>
          <CardTitle>Query Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ResultsTable results={scan.results} domain={scan.domain} />
        </CardContent>
      </Card>

      {/* Missed queries */}
      {missed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Missed Queries ({missed.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {missed.map((r) => (
                <li key={r.id} className="text-muted-foreground">
                  {r.query}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import Link from "next/link"
import { ArrowRight, Clock, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ScoreBadge } from "@/components/score-badge"
import type { Scan } from "@/lib/db/schema"

const statusLabels: Record<string, string> = {
  pending: "Pending",
  scraping: "Scraping",
  generating: "Generating queries",
  searching: "Searching",
  complete: "Complete",
  failed: "Failed",
}

export function ScanCard({ scan }: { scan: Scan }) {
  const isRunning = !["complete", "failed"].includes(scan.status)

  return (
    <Link href={`/scans/${scan.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{scan.domain}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {isRunning ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {statusLabels[scan.status] || scan.status}
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  {new Date(scan.createdAt).toLocaleDateString()}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ScoreBadge score={scan.score} />
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

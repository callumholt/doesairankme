import { ArrowRight, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import { ScoreBadge } from "@/components/score-badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Scan } from "@/lib/db/schema"

const statusLabels: Record<string, string> = {
  pending: "Pending",
  scraping: "Scraping",
  generating: "Generating queries",
  searching: "Searching",
  complete: "Complete",
  failed: "Failed",
}

function getBorderColour(score: number | null): string {
  if (score === null) return "border-l-muted-foreground/20"
  if (score < 30) return "border-l-red-500/60"
  if (score < 60) return "border-l-amber-500/60"
  return "border-l-[#14F0C3]/60"
}

export function ScanCard({ scan }: { scan: Scan }) {
  const isRunning = !["complete", "failed"].includes(scan.status)

  return (
    <Link href={`/scans/${scan.id}`}>
      <Card
        className={`border-l-[3px] ${getBorderColour(scan.score)} transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:shadow-[#14F0C3]/5 hover:border-[#14F0C3]/20`}
      >
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {scan.domain}
              <span className="ml-2 text-xs font-mono text-muted-foreground/60">{scan.provider}</span>
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              {isRunning ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-[#14F0C3]" />
                  <span className="font-mono text-xs">{statusLabels[scan.status] || scan.status}</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  <span className="font-mono text-xs">{new Date(scan.createdAt).toLocaleDateString()}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ScoreBadge score={scan.score} />
            <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

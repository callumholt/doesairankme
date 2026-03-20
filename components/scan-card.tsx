import { ArrowRight, Clock, Layers, Loader2 } from "lucide-react"
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

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Gemini",
  openai: "OpenAI",
  perplexity: "Perplexity",
  "perplexity-sonar": "Perplexity Sonar",
  "perplexity-sonar-pro": "Perplexity Sonar Pro",
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
              <span className="ml-2 text-xs font-mono text-muted-foreground/60">
                {PROVIDER_LABELS[scan.provider] || scan.provider}
              </span>
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

function getGroupBorderColour(scans: Scan[]): string {
  const completedScans = scans.filter((s) => s.status === "complete" && s.score !== null)
  if (completedScans.length === 0) return "border-l-muted-foreground/20"
  const avgScore = completedScans.reduce((sum, s) => sum + s.score!, 0) / completedScans.length
  if (avgScore < 30) return "border-l-red-500/60"
  if (avgScore < 60) return "border-l-amber-500/60"
  return "border-l-[#14F0C3]/60"
}

export function GroupScanCard({ scans: groupScans, groupId }: { scans: Scan[]; groupId: string }) {
  const domain = groupScans[0].domain
  const anyRunning = groupScans.some((s) => !["complete", "failed"].includes(s.status))
  const createdAt = groupScans[0].createdAt

  return (
    <Link href={`/scans/group/${groupId}`}>
      <Card
        className={`border-l-[3px] ${getGroupBorderColour(groupScans)} transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:shadow-[#14F0C3]/5 hover:border-[#14F0C3]/20`}
      >
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {domain}
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-mono text-muted-foreground/60">
                <Layers className="h-3 w-3" />
                {groupScans.length} providers
              </span>
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              {anyRunning ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-[#14F0C3]" />
                  <span className="font-mono text-xs">Scanning...</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  <span className="font-mono text-xs">{new Date(createdAt).toLocaleDateString()}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {groupScans.map((scan) => (
              <div key={scan.id} className="text-center">
                <ScoreBadge score={scan.score} className="text-xs px-2 py-1" />
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">
                  {PROVIDER_LABELS[scan.provider]?.[0] || scan.provider[0].toUpperCase()}
                </p>
              </div>
            ))}
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

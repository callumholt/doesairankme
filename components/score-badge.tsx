import { cn } from "@/lib/utils"

export function ScoreBadge({ score, className }: { score: number | null; className?: string }) {
  if (score === null) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-muted-foreground/20 bg-muted/50 px-3 py-1.5",
          className,
        )}
      >
        <span className="font-mono text-sm text-muted-foreground">--</span>
      </div>
    )
  }

  const isLow = score < 30
  const isMid = score >= 30 && score < 60
  const isHigh = score >= 60

  const colourClasses = isLow
    ? "border-red-500/30 text-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]"
    : isMid
      ? "border-amber-500/30 text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]"
      : "border-[#14F0C3]/30 text-[#14F0C3] shadow-[0_0_15px_-3px_rgba(20,240,195,0.4)]"

  const bgClasses = isLow ? "bg-red-500/10" : isMid ? "bg-amber-500/10" : "bg-[#14F0C3]/10"

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-3 py-1.5",
        bgClasses,
        colourClasses,
        className,
      )}
    >
      <span className="font-mono text-lg font-bold tabular-nums">{score}</span>
    </div>
  )
}

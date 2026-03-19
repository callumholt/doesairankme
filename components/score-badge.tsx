import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ScoreBadge({ score, className }: { score: number | null; className?: string }) {
  if (score === null) return <Badge variant="secondary">Pending</Badge>

  const colour =
    score < 30 ? "bg-red-500/15 text-red-700 dark:text-red-400" : score < 60 ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-green-500/15 text-green-700 dark:text-green-400"

  return (
    <Badge variant="secondary" className={cn(colour, className)}>
      {score}
    </Badge>
  )
}

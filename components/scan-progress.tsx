"use client"

import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const steps = [
  { key: "pending", label: "Queued" },
  { key: "scraping", label: "Scraping website" },
  { key: "generating", label: "Generating queries" },
  { key: "searching", label: "Searching AI" },
  { key: "complete", label: "Complete" },
]

const stepOrder = ["pending", "scraping", "generating", "searching", "complete"]

export function ScanProgress({
  status,
  resultCount,
  queryCount,
}: {
  status: string
  resultCount: number
  queryCount: number
}) {
  const currentIndex = stepOrder.indexOf(status)
  const progressPercent =
    status === "complete"
      ? 100
      : status === "searching"
        ? 20 + (resultCount / queryCount) * 60
        : (currentIndex / (stepOrder.length - 1)) * 20

  return (
    <div className="space-y-6">
      {/* Teal progress bar with glow */}
      <div className="relative">
        <Progress
          value={progressPercent}
          className="h-2 [&>div]:bg-primary [&>div]:shadow-[0_0_10px_rgba(20,240,195,0.5)]"
        />
        <div className="flex justify-between mt-2">
          <span className="font-mono text-xs text-muted-foreground">{Math.round(progressPercent)}%</span>
          {status === "searching" && queryCount > 0 && (
            <span className="font-mono text-xs text-primary">
              {resultCount}/{queryCount} queries
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const stepIndex = stepOrder.indexOf(step.key)
          const isDone = currentIndex > stepIndex
          const isCurrent = currentIndex === stepIndex

          let label = step.label
          if (step.key === "searching" && isCurrent) {
            label = `Searching AI (${resultCount}/${queryCount})`
          }

          return (
            <div key={step.key} className="flex items-center gap-3 text-sm">
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : isCurrent ? (
                <div className="relative">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <div className="absolute inset-0 h-4 w-4 rounded-full bg-primary/20 animate-ping" />
                </div>
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/20" />
              )}
              <span
                className={
                  isDone
                    ? "text-muted-foreground"
                    : isCurrent
                      ? "text-primary font-medium"
                      : "text-muted-foreground/40"
                }
              >
                {isCurrent ? <span className="font-mono">{label}</span> : label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

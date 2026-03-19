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

export function ScanProgress({ status, resultCount, queryCount }: { status: string; resultCount: number; queryCount: number }) {
  const currentIndex = stepOrder.indexOf(status)
  const progressPercent = status === "complete" ? 100 : status === "searching" ? 20 + (resultCount / queryCount) * 60 : (currentIndex / (stepOrder.length - 1)) * 20

  return (
    <div className="space-y-6">
      <Progress value={progressPercent} className="h-2" />

      <div className="space-y-3">
        {steps.map((step, i) => {
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
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
              <span className={isDone || isCurrent ? "text-foreground" : "text-muted-foreground/60"}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { desc, eq } from "drizzle-orm"
import { Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { ScanCard } from "@/components/scan-card"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { scans } from "@/lib/db/schema"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your AI visibility scans and discoverability scores.",
  robots: { index: false, follow: false },
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const db = getDb()
  const userScans = await db.query.scans.findMany({
    where: eq(scans.userId, session.user.id),
    orderBy: [desc(scans.createdAt)],
  })

  const completedScans = userScans.filter((s) => s.status === "complete" && s.score !== null)
  const avgScore =
    completedScans.length > 0 ? completedScans.reduce((sum, s) => sum + s.score!, 0) / completedScans.length : null
  const bestScore = completedScans.length > 0 ? Math.max(...completedScans.map((s) => s.score!)) : null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild className="bg-[#14F0C3] text-zinc-950 hover:bg-[#14F0C3]/80 font-medium">
          <Link href="/scans/new">
            <Plus className="mr-1 h-4 w-4" />
            New Scan
          </Link>
        </Button>
      </div>

      {completedScans.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#14F0C3]/15 bg-[#14F0C3]/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Scans</p>
            <p className="text-3xl font-bold font-mono tabular-nums mt-1 text-foreground">{userScans.length}</p>
          </div>
          <div className="rounded-lg border border-[#14F0C3]/15 bg-[#14F0C3]/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Average Score</p>
            <p className="text-3xl font-bold font-mono tabular-nums mt-1 text-[#14F0C3]">
              {avgScore !== null ? avgScore.toFixed(1) : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-[#14F0C3]/15 bg-[#14F0C3]/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Best Score</p>
            <p className="text-3xl font-bold font-mono tabular-nums mt-1 text-[#14F0C3]">
              {bestScore !== null ? bestScore.toFixed(1) : "-"}
            </p>
          </div>
        </div>
      )}

      {userScans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#14F0C3]/20 p-16 text-center">
          {/* Pulsing radar animation */}
          <div className="relative mb-8">
            <div className="h-20 w-20 rounded-full border border-[#14F0C3]/20 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border border-[#14F0C3]/30 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-[#14F0C3]/60 animate-pulse" />
              </div>
            </div>
            <div className="absolute inset-0 h-20 w-20 rounded-full border border-[#14F0C3]/10 animate-ping" />
            <div className="absolute inset-0 h-20 w-20 rounded-full border border-[#14F0C3]/5 animate-ping [animation-delay:500ms]" />
          </div>
          <h2 className="text-lg font-semibold">No scans yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Run your first scan to see how discoverable your site is to AI models.
          </p>
          <Button asChild className="mt-6 bg-[#14F0C3] text-zinc-950 hover:bg-[#14F0C3]/80 font-medium">
            <Link href="/scans/new">
              <Plus className="mr-1 h-4 w-4" />
              Run First Scan
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {userScans.map((scan) => (
            <ScanCard key={scan.id} scan={scan} />
          ))}
        </div>
      )}
    </div>
  )
}

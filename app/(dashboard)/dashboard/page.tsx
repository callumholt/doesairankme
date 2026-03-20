import { desc, eq } from "drizzle-orm"
import { Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { GroupScanCard, ScanCard } from "@/components/scan-card"
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
          {(() => {
            // Group scans by groupId, keeping ungrouped scans separate
            const grouped = new Map<string, typeof userScans>()
            const ungrouped: typeof userScans = []

            for (const scan of userScans) {
              if (scan.groupId) {
                if (!grouped.has(scan.groupId)) {
                  grouped.set(scan.groupId, [])
                }
                grouped.get(scan.groupId)!.push(scan)
              } else {
                ungrouped.push(scan)
              }
            }

            // Build display list in chronological order (newest first)
            type DisplayItem =
              | { type: "single"; scan: (typeof userScans)[0] }
              | { type: "group"; groupId: string; scans: typeof userScans }
            const items: DisplayItem[] = []

            // Merge groups and singles by their createdAt
            const groupEntries = Array.from(grouped.entries()).map(([gId, gScans]) => ({
              type: "group" as const,
              groupId: gId,
              scans: gScans,
              createdAt: gScans[0].createdAt,
            }))
            const singleEntries = ungrouped.map((scan) => ({
              type: "single" as const,
              scan,
              createdAt: scan.createdAt,
            }))

            const all = [...groupEntries, ...singleEntries].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )

            for (const item of all) {
              if (item.type === "group") {
                items.push({ type: "group", groupId: item.groupId, scans: item.scans })
              } else {
                items.push({ type: "single", scan: item.scan })
              }
            }

            return items.map((item) =>
              item.type === "group" ? (
                <GroupScanCard key={item.groupId} groupId={item.groupId} scans={item.scans} />
              ) : (
                <ScanCard key={item.scan.id} scan={item.scan} />
              ),
            )
          })()}
        </div>
      )}
    </div>
  )
}

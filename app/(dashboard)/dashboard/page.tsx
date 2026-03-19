import { desc, eq } from "drizzle-orm"
import Link from "next/link"
import { Plus } from "lucide-react"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { scans } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { ScanCard } from "@/components/scan-card"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const db = getDb()
  const userScans = await db.query.scans.findMany({
    where: eq(scans.userId, session.user.id),
    orderBy: [desc(scans.createdAt)],
  })

  const completedScans = userScans.filter((s) => s.status === "complete" && s.score !== null)
  const avgScore = completedScans.length > 0 ? completedScans.reduce((sum, s) => sum + s.score!, 0) / completedScans.length : null
  const bestScore = completedScans.length > 0 ? Math.max(...completedScans.map((s) => s.score!)) : null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/scans/new">
            <Plus className="mr-1 h-4 w-4" />
            New Scan
          </Link>
        </Button>
      </div>

      {completedScans.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total Scans</p>
            <p className="text-2xl font-bold">{userScans.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className="text-2xl font-bold">{avgScore !== null ? avgScore.toFixed(1) : "-"}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Best Score</p>
            <p className="text-2xl font-bold">{bestScore !== null ? bestScore.toFixed(1) : "-"}</p>
          </div>
        </div>
      )}

      {userScans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-lg font-semibold">No scans yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Run your first scan to see how discoverable your site is to AI.</p>
          <Button asChild className="mt-4">
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

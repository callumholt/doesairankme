import { and, eq, inArray } from "drizzle-orm"
import { NextResponse } from "next/server"
import type { AuditResults } from "@/lib/audit"
import { generateRecommendations } from "@/lib/audit/recommendations"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { scans, siteAudits } from "@/lib/db/schema"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  const { id } = await params
  const db = getDb()

  // Find the scan — if user is authenticated, scope to their scans
  const scanWhere = session?.user?.id ? and(eq(scans.id, id), eq(scans.userId, session.user.id)) : eq(scans.id, id)

  const scan = await db.query.scans.findFirst({ where: scanWhere })
  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 })
  }

  // Look for audit on this scan first
  let audit = await db.query.siteAudits.findFirst({
    where: eq(siteAudits.scanId, id),
  })

  // If not found and scan is part of a group, check sibling scans
  // (audit is attached to the first scan in the group)
  if (!audit && scan.groupId) {
    const groupScans = await db.query.scans.findMany({
      where: eq(scans.groupId, scan.groupId),
    })
    const siblingIds = groupScans.map((s) => s.id)
    if (siblingIds.length > 0) {
      audit =
        (await db.query.siteAudits.findFirst({
          where: inArray(siteAudits.scanId, siblingIds),
        })) ?? undefined
    }
  }

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 })
  }

  const recommendations = generateRecommendations(audit.results as AuditResults)

  return NextResponse.json({ ...audit, recommendations })
}

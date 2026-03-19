import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
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

  const audit = await db.query.siteAudits.findFirst({
    where: eq(siteAudits.scanId, id),
  })

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 })
  }

  return NextResponse.json(audit)
}

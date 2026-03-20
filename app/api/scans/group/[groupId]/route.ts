import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { scans } from "@/lib/db/schema"

export async function GET(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { groupId } = await params
  const db = getDb()

  const groupScans = await db.query.scans.findMany({
    where: and(eq(scans.groupId, groupId), eq(scans.userId, session.user.id)),
    with: {
      results: true,
    },
  })

  if (groupScans.length === 0) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 })
  }

  return NextResponse.json(groupScans)
}

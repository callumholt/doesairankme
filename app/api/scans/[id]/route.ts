import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { scans } from "@/lib/db/schema"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { id } = await params
  const db = getDb()

  const scan = await db.query.scans.findFirst({
    where: and(eq(scans.id, id), eq(scans.userId, session.user.id)),
    with: {
      results: true,
    },
  })

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 })
  }

  return NextResponse.json(scan)
}

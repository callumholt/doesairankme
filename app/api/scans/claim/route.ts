import { and, eq, isNull } from "drizzle-orm"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { scans } from "@/lib/db/schema"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const cookieStore = await cookies()
  const anonToken = cookieStore.get("anon_scan_token")?.value

  if (!anonToken) {
    return NextResponse.json({ claimed: 0 })
  }

  const db = getDb()
  await db
    .update(scans)
    .set({
      userId: session.user.id,
      anonToken: null,
      anonIp: null,
    })
    .where(and(eq(scans.anonToken, anonToken), isNull(scans.userId)))

  cookieStore.delete("anon_scan_token")

  return NextResponse.json({ claimed: true })
}

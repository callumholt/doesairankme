import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const db = getDb()
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  return NextResponse.json({
    plan: user?.plan || "free",
    planExpiresAt: user?.planExpiresAt,
  })
}

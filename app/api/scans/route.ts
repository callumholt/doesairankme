import { desc, eq, and, gte, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { after, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { scans } from "@/lib/db/schema"
import { runScan } from "@/lib/scan/runner"
import { createScanSchema } from "@/lib/validations/scan"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { url, provider, queryCount } = createScanSchema.parse(body)

    const db = getDb()

    // Rate limit: max 5 scans per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentScans = await db
      .select({ count: sql<number>`count(*)` })
      .from(scans)
      .where(and(eq(scans.userId, session.user.id), gte(scans.createdAt, oneHourAgo)))

    if (recentScans[0].count >= 5) {
      return NextResponse.json({ error: "Rate limit exceeded. Max 5 scans per hour." }, { status: 429 })
    }

    const domain = new URL(url).hostname.replace(/^www\./, "")
    const id = nanoid()

    await db.insert(scans).values({
      id,
      userId: session.user.id,
      url,
      domain,
      provider,
      queryCount,
      status: "pending",
    })

    after(async () => {
      await runScan(id)
    })

    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const db = getDb()
  const userScans = await db.query.scans.findMany({
    where: eq(scans.userId, session.user.id),
    orderBy: [desc(scans.createdAt)],
  })

  return NextResponse.json(userScans)
}

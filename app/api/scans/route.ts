import { and, desc, eq, gte, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { after, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { scans, users } from "@/lib/db/schema"
import { runScanGroup } from "@/lib/scan/runner"
import { PLANS, type PlanId } from "@/lib/stripe/client"
import { createScanSchema } from "@/lib/validations/scan"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = createScanSchema.parse(body)
    const url = parsed.url
    const queryCount = parsed.queryCount

    // Resolve provider list: support both single and multi-provider
    const providerList =
      parsed.providers && parsed.providers.length > 0 ? parsed.providers : [parsed.provider || "gemini"]

    const db = getDb()

    // Get user's plan
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    })
    const plan = PLANS[(user?.plan as PlanId) || "free"]

    // Check provider access
    for (const provider of providerList) {
      if (!plan.providers.includes(provider)) {
        return NextResponse.json(
          { error: `${provider} is only available on the Pro plan. Upgrade to unlock all providers.` },
          { status: 403 },
        )
      }
    }

    // Check monthly scan limit
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyScans = await db
      .select({ count: sql<number>`count(*)` })
      .from(scans)
      .where(and(eq(scans.userId, session.user.id), gte(scans.createdAt, startOfMonth)))

    if (monthlyScans[0].count + providerList.length > plan.scansPerMonth) {
      return NextResponse.json(
        { error: `You've used all ${plan.scansPerMonth} scans this month. Upgrade to Pro for unlimited scans.` },
        { status: 403 },
      )
    }

    // Rate limit: max 5 scans per user per hour (unless exempt)
    if (!user?.rateLimitExempt) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentScans = await db
        .select({ count: sql<number>`count(*)` })
        .from(scans)
        .where(and(eq(scans.userId, session.user.id), gte(scans.createdAt, oneHourAgo)))

      if (recentScans[0].count + providerList.length > 5) {
        return NextResponse.json({ error: "Rate limit exceeded. Max 5 scans per hour." }, { status: 429 })
      }
    }

    const domain = new URL(url).hostname.replace(/^www\./, "")
    const ids: string[] = []
    const groupId = providerList.length > 1 ? nanoid() : null

    for (const provider of providerList) {
      const id = nanoid()
      ids.push(id)

      await db.insert(scans).values({
        id,
        userId: session.user.id,
        groupId,
        url,
        domain,
        provider,
        queryCount,
        status: "pending",
      })
    }

    // Run all providers as a single group (scrape once, generate queries once)
    after(async () => {
      await runScanGroup(ids)
    })

    if (groupId) {
      return NextResponse.json({ groupId, ids }, { status: 201 })
    }
    return NextResponse.json({ id: ids[0] }, { status: 201 })
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

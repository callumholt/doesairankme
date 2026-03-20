import { and, eq, gte, isNull, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { cookies, headers } from "next/headers"
import { after, NextResponse } from "next/server"
import { getDb } from "@/lib/db/client"
import { scans } from "@/lib/db/schema"
import { runScanGroup } from "@/lib/scan/runner"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawUrl = typeof body.url === "string" ? body.url.trim() : ""

    if (!rawUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Normalise URL
    let url = rawUrl
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    }

    let domain: string
    try {
      domain = new URL(url).hostname.replace(/^www\./, "")
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Rate limit by IP: 1 anonymous scan per 24h
    const headerList = await headers()
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const db = getDb()

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentAnon = await db
      .select({ count: sql<number>`count(*)` })
      .from(scans)
      .where(and(eq(scans.anonIp, ip), isNull(scans.userId), gte(scans.createdAt, oneDayAgo)))

    if (recentAnon[0].count >= 1) {
      return NextResponse.json(
        { error: "You've already run a free scan today. Sign up for more scans." },
        { status: 429 },
      )
    }

    // Clean up old anonymous scans (> 7 days, unclaimed)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    after(async () => {
      const cleanupDb = getDb()
      await cleanupDb
        .delete(scans)
        .where(and(isNull(scans.userId), isNull(scans.anonToken), gte(scans.createdAt, new Date(0))))
        .catch(() => {})
      await cleanupDb
        .execute(sql`DELETE FROM scans WHERE user_id IS NULL AND created_at < ${sevenDaysAgo}`)
        .catch(() => {})
    })

    const id = nanoid()
    const anonToken = nanoid(32)

    await db.insert(scans).values({
      id,
      userId: null,
      anonToken,
      anonIp: ip,
      url,
      domain,
      provider: "gemini",
      queryCount: 5,
      status: "pending",
    })

    // Set cookie for scan ownership
    const cookieStore = await cookies()
    cookieStore.set("anon_scan_token", anonToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    after(async () => {
      await runScanGroup([id])
    })

    return NextResponse.json({ id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

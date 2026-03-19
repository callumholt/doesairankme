import { and, eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getDb } from "@/lib/db/client"
import { scans } from "@/lib/db/schema"

const FREE_RESULTS_VISIBLE = 2

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const anonToken = cookieStore.get("anon_scan_token")?.value

  if (!anonToken) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 })
  }

  const db = getDb()
  const scan = await db.query.scans.findFirst({
    where: and(eq(scans.id, id), eq(scans.anonToken, anonToken)),
    with: {
      results: true,
    },
  })

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 })
  }

  // Gate results: show first N fully, redact the rest
  const gatedResults = scan.results.map((result, index) => {
    if (index < FREE_RESULTS_VISIBLE) {
      return { ...result, gated: false }
    }
    return {
      id: result.id,
      scanId: result.scanId,
      query: result.query,
      position: null,
      sources: [],
      searchQueries: [],
      responseSnippet: null,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      error: null,
      createdAt: result.createdAt,
      gated: true,
    }
  })

  return NextResponse.json({
    ...scan,
    results: gatedResults,
  })
}

import { and, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { scans } from "@/lib/db/schema"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://doesairankme.com"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { id } = await params
  const db = getDb()

  const scan = await db.query.scans.findFirst({
    where: and(eq(scans.id, id), eq(scans.userId, session.user.id)),
  })

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 })
  }

  const slug = scan.publicSlug ?? nanoid(10)

  await db.update(scans).set({ isPublic: true, publicSlug: slug }).where(eq(scans.id, id))

  const shareUrl = `${BASE_URL}/report/${slug}`

  return NextResponse.json({ isPublic: true, publicSlug: slug, shareUrl })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { id } = await params
  const db = getDb()

  const scan = await db.query.scans.findFirst({
    where: and(eq(scans.id, id), eq(scans.userId, session.user.id)),
  })

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 })
  }

  await db.update(scans).set({ isPublic: false }).where(eq(scans.id, id))

  return NextResponse.json({ isPublic: false })
}

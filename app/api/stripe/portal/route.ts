import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { getStripe } from "@/lib/stripe/client"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const db = getDb()
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 })
  }

  const stripe = getStripe()
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${request.headers.get("origin")}/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}

import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { getStripe } from "@/lib/stripe/client"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { priceId } = await request.json()
  if (!priceId) {
    return NextResponse.json({ error: "Price ID is required" }, { status: 400 })
  }

  const stripe = getStripe()
  const db = getDb()

  // Get or create Stripe customer
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  let customerId = user?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { userId: session.user.id },
    })
    customerId = customer.id

    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, session.user.id))
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${request.headers.get("origin")}/dashboard?upgraded=true`,
    cancel_url: `${request.headers.get("origin")}/billing`,
    metadata: { userId: session.user.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}

import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { getStripe } from "@/lib/stripe/client"

async function updateUserPlan(
  customerId: string,
  data: { plan?: string; stripeSubscriptionId?: string | null; stripePriceId?: string | null; planExpiresAt?: Date | null },
) {
  const db = getDb()
  await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.stripeCustomerId, customerId))
}

function getSubscriptionFields(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]
  return {
    stripeSubscriptionId: subscription.id,
    stripePriceId: item?.price.id,
    planExpiresAt: item ? new Date(item.current_period_end * 1000) : null,
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret) as Stripe.Event
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription

      await updateUserPlan(customerId, {
        plan: "pro",
        ...getSubscriptionFields(sub),
      })
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await updateUserPlan(customerId, {
        plan: "free",
        stripeSubscriptionId: null,
        stripePriceId: null,
        planExpiresAt: null,
      })
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const subItem = subscription.items.data[0]
      const periodEnd = subItem ? new Date(subItem.current_period_end * 1000) : null

      if (subscription.cancel_at_period_end) {
        await updateUserPlan(customerId, {
          planExpiresAt: periodEnd,
        })
      } else {
        await updateUserPlan(customerId, {
          plan: "pro",
          stripePriceId: subItem?.price.id,
          planExpiresAt: periodEnd,
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

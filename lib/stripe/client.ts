import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is not set")
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" })
  }
  return _stripe
}

export const PLANS = {
  free: {
    name: "Free",
    scansPerMonth: 3,
    providers: ["gemini", "openai", "perplexity"] as string[],
  },
  pro: {
    name: "Pro",
    scansPerMonth: Infinity,
    providers: ["gemini", "openai", "perplexity"] as string[],
  },
} as const

export type PlanId = keyof typeof PLANS

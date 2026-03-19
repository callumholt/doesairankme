"use client"

import { useEffect, useState } from "react"
import { Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const MONTHLY_PRICE_ID = "price_1TCbXbLMdZYvFHDsx7d1OCzi"
const YEARLY_PRICE_ID = "price_1TCbXcLMdZYvFHDsASyziYQ3"

const features = {
  free: ["3 scans per month", "Gemini provider", "Basic reports"],
  pro: [
    "Unlimited scans",
    "All providers (Gemini, OpenAI, Perplexity)",
    "Priority processing",
    "Full reports with source details",
    "Score tracking over time",
  ],
}

export default function BillingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>("free")

  useEffect(() => {
    fetch("/api/user/plan").then((r) => r.json()).then((d) => setUserPlan(d.plan || "free"))
  }, [])

  async function handleCheckout(priceId: string) {
    setLoading(priceId)
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
    setLoading(null)
  }

  async function handlePortal() {
    setLoading("portal")
    const res = await fetch("/api/stripe/portal", { method: "POST" })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
    setLoading(null)
  }

  const priceId = billing === "monthly" ? MONTHLY_PRICE_ID : YEARLY_PRICE_ID

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card/50 p-1">
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${billing === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${billing === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setBilling("yearly")}
          >
            Yearly
            <span className="ml-1.5 text-xs opacity-70">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        {/* Free */}
        <Card className={`border-border/50 ${userPlan === "free" ? "ring-1 ring-muted-foreground/20" : ""}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Free</span>
              {userPlan === "free" && (
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded">
                  Current
                </span>
              )}
            </CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono">$0</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.free.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-muted-foreground/50" />
                {f}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className={`border-[#14F0C3]/30 ${userPlan === "pro" ? "ring-1 ring-[#14F0C3]/30" : ""}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#14F0C3]" />
                Pro
              </span>
              {userPlan === "pro" && (
                <span className="text-xs font-mono uppercase tracking-wider text-[#14F0C3] bg-[#14F0C3]/10 px-2 py-1 rounded">
                  Current
                </span>
              )}
            </CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono text-[#14F0C3]">
                ${billing === "monthly" ? "29" : "290"}
              </span>
              <span className="text-muted-foreground text-sm">
                /{billing === "monthly" ? "month" : "year"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.pro.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-[#14F0C3]" />
                {f}
              </div>
            ))}
            <div className="pt-4">
              {userPlan === "pro" ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handlePortal}
                  disabled={loading === "portal"}
                >
                  {loading === "portal" ? "Loading..." : "Manage subscription"}
                </Button>
              ) : (
                <Button
                  className="w-full bg-[#14F0C3] text-zinc-950 hover:bg-[#14F0C3]/80 font-medium glow-teal"
                  onClick={() => handleCheckout(priceId)}
                  disabled={loading === priceId}
                >
                  {loading === priceId ? "Loading..." : "Upgrade to Pro"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

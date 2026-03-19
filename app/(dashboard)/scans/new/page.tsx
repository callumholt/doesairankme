"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PRO_PROVIDERS = ["openai", "perplexity-sonar", "perplexity-sonar-pro"]

export default function NewScanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [plan, setPlan] = useState<string>("free")

  useEffect(() => {
    fetch("/api/user/plan").then((r) => r.json()).then((d) => setPlan(d.plan || "free"))
  }, [])

  const isFree = plan !== "pro"

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    let url = formData.get("url") as string
    const provider = formData.get("provider") as string
    const queryCount = parseInt(formData.get("queryCount") as string, 10)

    // Add https:// if no protocol
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    }

    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, provider, queryCount }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      const { id } = await res.json()
      router.push(`/scans/${id}`)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">New Scan</CardTitle>
          <CardDescription>
            Enter a URL to test how discoverable it is to AI assistants.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="url" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Website URL
              </Label>
              <Input
                id="url"
                name="url"
                placeholder="https://example.com"
                required
                className="h-12 text-base bg-background/50 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/40 font-mono placeholder:font-sans placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                AI Provider
              </Label>
              <Select name="provider" defaultValue="gemini">
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  {PRO_PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p} disabled={isFree}>
                      <span className="flex items-center gap-2">
                        {p === "openai" ? "OpenAI" : p === "perplexity-sonar" ? "Perplexity Sonar" : "Perplexity Sonar Pro"}
                        {isFree && <Lock className="h-3 w-3 text-muted-foreground/40" />}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isFree && (
                <Link
                  href="/billing"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-2 mt-1"
                >
                  <Zap className="h-3 w-3" />
                  Upgrade to Pro to unlock all providers
                </Link>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="queryCount" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Number of Queries
              </Label>
              <Select name="queryCount" defaultValue="10">
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 queries</SelectItem>
                  <SelectItem value="10">10 queries</SelectItem>
                  <SelectItem value="15">15 queries</SelectItem>
                  <SelectItem value="20">20 queries</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isFree && (
              <div className="rounded-md border border-primary/15 bg-primary/[0.04] p-3 text-xs text-muted-foreground">
                <span className="font-mono text-primary font-medium">Free plan:</span>{" "}
                3 scans per month.{" "}
                <Link href="/billing" className="text-primary underline underline-offset-2">
                  Upgrade for unlimited.
                </Link>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-teal"
              disabled={loading}
            >
              {loading ? "Starting scan..." : "Start Scan"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

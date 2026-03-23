"use client"

import { Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ALL_PROVIDERS = [
  { value: "gemini", label: "Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "perplexity", label: "Perplexity" },
]

export default function NewScanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [plan, setPlan] = useState<string>("free")
  const [selectedProviders, setSelectedProviders] = useState<string[]>(["gemini"])

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => setPlan(d.plan || "free"))
  }, [])

  const isPro = plan === "pro"

  function toggleProvider(provider: string) {
    setSelectedProviders((prev) => {
      if (prev.includes(provider)) {
        if (prev.length === 1) return prev // must keep at least one
        return prev.filter((p) => p !== provider)
      }
      return [...prev, provider]
    })
  }

  function selectAll() {
    setSelectedProviders(ALL_PROVIDERS.map((p) => p.value))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    let url = formData.get("url") as string
    const queryCount = parseInt(formData.get("queryCount") as string, 10)

    // Add https:// if no protocol
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    }

    const body =
      selectedProviders.length > 1
        ? { url, providers: selectedProviders, queryCount }
        : { url, provider: selectedProviders[0] || "gemini", queryCount }

    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      const data = await res.json()

      if (data.groupId) {
        router.push(`/scans/group/${data.groupId}`)
      } else {
        router.push(`/scans/${data.id}`)
      }
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
          <CardDescription>Enter a URL to test how discoverable it is to AI assistants.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">{error}</p>}

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
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  AI Providers
                </Label>
                {selectedProviders.length < ALL_PROVIDERS.length && (
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-primary hover:underline underline-offset-2 font-mono"
                  >
                    Select all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ALL_PROVIDERS.map((provider) => {
                  const isSelected = selectedProviders.includes(provider.value)
                  return (
                    <button
                      key={provider.value}
                      type="button"
                      onClick={() => toggleProvider(provider.value)}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-all text-left ${
                        isSelected
                          ? "border-primary/40 bg-primary/[0.08] text-foreground"
                          : "border-border/50 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      {provider.label}
                    </button>
                  )
                })}
              </div>
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

            {!isPro && (
              <div className="rounded-md border border-primary/15 bg-primary/[0.04] p-3 text-xs text-muted-foreground">
                <span className="font-mono text-primary font-medium">Free plan:</span> 3 scans per month.{" "}
                <Link href="/billing" className="text-primary underline underline-offset-2">
                  Upgrade for unlimited.
                </Link>
              </div>
            )}

            {selectedProviders.length > 1 && (
              <div className="rounded-md border border-primary/15 bg-primary/[0.04] p-3 text-xs text-muted-foreground">
                <span className="font-mono text-primary font-medium">
                  {selectedProviders.length} providers selected
                </span>{" "}
                &mdash; this will create {selectedProviders.length} parallel scans, one per provider.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-teal"
              disabled={loading}
            >
              {loading
                ? "Starting scan..."
                : selectedProviders.length > 1
                  ? `Start ${selectedProviders.length} Scans`
                  : "Start Scan"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

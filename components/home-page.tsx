"use client"

import { ArrowRight, BarChart3, ChevronRight, Globe, Loader2, Search, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

function AnimatedScore() {
  return (
    <span className="inline-flex items-baseline gap-1 font-mono">
      <span className="text-primary">_</span>
      <span className="text-primary">_</span>
      <span className="animate-blink text-primary">|</span>
    </span>
  )
}

const steps = [
  {
    number: "01",
    icon: Globe,
    title: "Enter your URL",
    description: "We scrape your site content to understand what you offer and who your customers are.",
  },
  {
    number: "02",
    icon: Search,
    title: "We query AI models",
    description:
      "We generate realistic search queries and run them against ChatGPT, Gemini, and Perplexity with web search enabled.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Get your score",
    description:
      "See exactly which queries found you, your position in cited sources, and your overall discoverability score.",
  },
]

const stats = [
  { value: "12,400+", label: "Queries run" },
  { value: "580+", label: "Sites tested" },
  { value: "3", label: "AI models" },
  { value: "< 2 min", label: "Time to results" },
]

export function HomePage() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState("")

  async function handleScan() {
    if (!url.trim()) return
    setScanError("")
    setScanning(true)

    let normalised = url.trim()
    if (!/^https?:\/\//i.test(normalised)) {
      normalised = `https://${normalised}`
    }

    try {
      const res = await fetch("/api/scans/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalised }),
      })

      const data = await res.json()

      if (!res.ok) {
        setScanError(data.error || "Something went wrong")
        setScanning(false)
        return
      }

      router.push(`/scan/${data.id}`)
    } catch {
      setScanError("Network error. Please try again.")
      setScanning(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grain" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-24 pb-20 md:pt-36 md:pb-28">
          <div className="text-center">
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 text-xs font-mono text-primary mb-8 animate-fade-in opacity-0"
              style={{ animationDelay: "0ms", animationFillMode: "forwards" }}
            >
              <Zap className="h-3 w-3" />
              AI discoverability testing
            </div>

            {/* Headline */}
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] animate-fade-in opacity-0"
              style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
            >
              <span className="block text-foreground">Invisible</span>
              <span className="block text-foreground/40">to AI?</span>
            </h1>

            {/* Score display */}
            <div
              className="mt-10 flex justify-center animate-fade-in opacity-0"
              style={{ animationDelay: "350ms", animationFillMode: "forwards" }}
            >
              <div className="inline-flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm px-8 py-5">
                <span className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Your score</span>
                <span className="text-4xl sm:text-5xl font-mono font-bold text-primary tabular-nums">
                  <AnimatedScore />
                </span>
              </div>
            </div>

            {/* Subheading */}
            <p
              className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in opacity-0"
              style={{ animationDelay: "500ms", animationFillMode: "forwards" }}
            >
              When someone asks ChatGPT, Gemini, or Perplexity for a recommendation in your industry — does your website
              come up?
            </p>

            {/* CTA */}
            <div
              className="mt-10 flex justify-center gap-4 animate-fade-in opacity-0"
              style={{ animationDelay: "650ms", animationFillMode: "forwards" }}
            >
              <Button
                size="lg"
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-medium glow-teal"
              >
                <Link href="/signup">
                  Test your site
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="h-12 px-8 text-base font-medium border-border/60 text-muted-foreground hover:text-foreground"
              >
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/50 bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-foreground tabular-nums">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-primary">Process</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
          </div>

          {/* Steps with connecting line */}
          <div className="relative grid gap-6 md:grid-cols-3">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-[3.25rem] left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-border via-primary/30 to-border" />

            {steps.map((step) => (
              <div
                key={step.number}
                className="group relative rounded-xl border border-border/50 bg-card/30 p-8 transition-all duration-300 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-[0_0_30px_oklch(0.82_0.17_170_/_6%)]"
              >
                {/* Step number */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/[0.08] font-mono text-sm font-bold text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/[0.15]">
                    {step.number}
                  </div>
                  <step.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary/60" />
                </div>

                <h3 className="font-semibold text-lg text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 grain" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/[0.04] blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 md:py-32">
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-primary">Get started</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Find out in under 2 minutes</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Enter your URL and we will query the leading AI assistants to see if they recommend your website.
            </p>
          </div>

          {/* URL input */}
          <div className="mt-10 mx-auto max-w-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleScan()
              }}
            >
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="yourwebsite.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={scanning}
                    className="h-12 w-full rounded-lg border border-primary/20 bg-card/50 pl-11 pr-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/50 focus:shadow-[0_0_20px_oklch(0.82_0.17_170_/_10%)] disabled:opacity-50"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={scanning || !url.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 font-medium glow-teal shrink-0"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Scan
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
            {scanError && <p className="mt-3 text-center text-sm text-destructive font-mono">{scanError}</p>}
            <p className="mt-3 text-center text-xs text-muted-foreground/60 font-mono">
              Free to start. No credit card required.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

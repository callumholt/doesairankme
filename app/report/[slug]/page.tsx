import { eq } from "drizzle-orm"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ResultsTable } from "@/components/results-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDb } from "@/lib/db/client"
import { scans } from "@/lib/db/schema"

interface Props {
  params: Promise<{ slug: string }>
}

async function getScan(slug: string) {
  const db = getDb()
  const scan = await db.query.scans.findFirst({
    where: eq(scans.publicSlug, slug),
    with: {
      results: true,
    },
  })
  if (!scan || !scan.isPublic || scan.status !== "complete") return null
  return scan
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const scan = await getScan(slug)

  if (!scan) {
    return { title: "Report Not Found" }
  }

  const score = scan.score !== null ? Math.round(scan.score) : null
  const title = `AI Visibility Report: ${scan.domain}`
  const description =
    score !== null
      ? `${scan.domain} scored ${score}/100 for AI discoverability. See how visible this site is to ChatGPT, Perplexity, and Gemini.`
      : `See how visible ${scan.domain} is to ChatGPT, Perplexity, and Gemini.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

function HeroScore({ score }: { score: number | null }) {
  if (score === null) return null

  const rounded = Math.round(score)
  const isLow = rounded < 30
  const isMid = rounded >= 30 && rounded < 60

  const glowColour = isLow
    ? "shadow-[0_0_60px_-10px_rgba(239,68,68,0.35)]"
    : isMid
      ? "shadow-[0_0_60px_-10px_rgba(245,158,11,0.35)]"
      : "shadow-[0_0_60px_-10px_rgba(20,240,195,0.35)]"

  const textColour = isLow ? "text-red-400" : isMid ? "text-amber-400" : "text-[#14F0C3]"

  const borderColour = isLow ? "border-red-500/20" : isMid ? "border-amber-500/20" : "border-[#14F0C3]/20"

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border ${borderColour} bg-card p-8 ${glowColour}`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">AI Discoverability Score</p>
      <span className={`font-mono text-7xl font-bold tabular-nums ${textColour}`}>{rounded}</span>
      <p className="text-xs text-muted-foreground mt-3 font-mono">/ 100</p>
    </div>
  )
}

export default async function PublicReportPage({ params }: Props) {
  const { slug } = await params
  const scan = await getScan(slug)

  if (!scan) {
    notFound()
  }

  const found = scan.results.filter((r) => r.position !== null)
  const missed = scan.results.filter((r) => r.position === null)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-6">
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
          >
            doesairankme
          </Link>
          <div className="ml-auto">
            <Link href="/" className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
              Scan your own site
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
          {/* Page heading */}
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono mb-1">
              AI Visibility Report
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{scan.domain}</h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-mono">
              Scanned{" "}
              {new Date(scan.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}{" "}
              via {scan.provider}
              {scan.contentSource && ` (${scan.contentSource})`}
            </p>
          </div>

          {/* Hero score */}
          <HeroScore score={scan.score} />

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-[#14F0C3]/10 bg-[#14F0C3]/[0.02] p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Appearance Rate</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-foreground">
                {scan.appearanceRate !== null ? `${Math.round(scan.appearanceRate * 100)}%` : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-[#14F0C3]/10 bg-[#14F0C3]/[0.02] p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg Position</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-foreground">
                {scan.avgPosition !== null ? scan.avgPosition.toFixed(1) : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-[#14F0C3]/10 bg-[#14F0C3]/[0.02] p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Found / Total</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-foreground">
                <span className="text-[#14F0C3]">{found.length}</span>
                <span className="text-muted-foreground mx-1">/</span>
                {scan.results.length}
              </p>
            </div>
          </div>

          {/* Results table */}
          <Card className="border-[#14F0C3]/10">
            <CardHeader>
              <CardTitle>Query Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsTable results={scan.results} domain={scan.domain} />
            </CardContent>
          </Card>

          {/* Missed queries */}
          {missed.length > 0 && (
            <Card className="border-muted-foreground/10">
              <CardHeader>
                <CardTitle className="text-muted-foreground">
                  Missed Queries <span className="font-mono text-sm">({missed.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {missed.map((r) => (
                    <li key={r.id} className="text-muted-foreground/70 border-l-2 border-red-500/20 pl-3">
                      {r.query}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <div className="rounded-xl border border-[#14F0C3]/20 bg-[#14F0C3]/[0.03] p-8 text-center">
            <h2 className="text-xl font-bold tracking-tight mb-2">How does your site rank?</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Find out how visible your website is to AI assistants like ChatGPT, Perplexity, and Gemini.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-[#14F0C3] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#14F0C3]/90 transition-colors"
            >
              Scan your own site
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 py-6">
        <div className="mx-auto max-w-4xl px-6 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>doesairankme</span>
          <span>AI discoverability testing</span>
        </div>
      </footer>
    </div>
  )
}

import Link from "next/link"
import { ArrowRight, Globe, Search, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Does AI Rank Me?
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            When someone asks ChatGPT, Gemini, or Perplexity for a recommendation in your industry, does your website
            come up? Find out in minutes.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Test your site
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">1. Enter your URL</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We scrape your site content to understand what you offer and who your customers are.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">2. We query AI</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We generate realistic search queries and run them against AI assistants with web search enabled.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">3. Get your score</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                See exactly which queries found you, your position in cited sources, and your overall discoverability score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to find out?</h2>
          <p className="mt-4 text-muted-foreground">
            Create a free account and run your first AI discoverability scan.
          </p>
          <Button size="lg" asChild className="mt-8">
            <Link href="/signup">
              Get started for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

import { Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 transition-colors group-hover:border-primary/60 group-hover:bg-primary/20">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight text-foreground">doesairankme</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 pt-14">{children}</main>
      <footer className="border-t border-border/50 py-6">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>doesairankme</span>
          <span>AI discoverability testing</span>
        </div>
      </footer>
    </div>
  )
}

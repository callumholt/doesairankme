"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Nav({ userName }: { userName?: string | null }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-[#14F0C3]/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link href="/dashboard" className="mr-8 flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#14F0C3]/10 border border-[#14F0C3]/20 group-hover:bg-[#14F0C3]/20 transition-colors">
            <span className="font-mono text-xs font-bold text-[#14F0C3]">AI</span>
          </div>
          <span className="font-mono text-sm font-bold tracking-tight">
            Does AI Rank Me<span className="text-[#14F0C3]">?</span>
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/dashboard"
            className={cn(
              "relative transition-colors hover:text-foreground",
              pathname === "/dashboard"
                ? "text-[#14F0C3] font-medium after:absolute after:-bottom-[17px] after:left-0 after:right-0 after:h-px after:bg-[#14F0C3]"
                : "text-muted-foreground",
            )}
          >
            Dashboard
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Button asChild size="sm" className="bg-[#14F0C3] text-zinc-950 hover:bg-[#14F0C3]/80 font-medium">
            <Link href="/scans/new">
              <Plus className="mr-1 h-4 w-4" />
              New Scan
            </Link>
          </Button>

          <span className="text-xs text-muted-foreground font-mono">{userName}</span>

          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

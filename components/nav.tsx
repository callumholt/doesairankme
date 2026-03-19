"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Nav({ userName }: { userName?: string | null }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link href="/dashboard" className="mr-6 flex items-center gap-2 font-semibold">
          <Search className="h-5 w-5" />
          <span>Does AI Rank Me?</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/dashboard"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/dashboard" ? "text-foreground" : "text-foreground/60",
            )}
          >
            Dashboard
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/scans/new">
              <Plus className="mr-1 h-4 w-4" />
              New Scan
            </Link>
          </Button>

          <span className="text-sm text-muted-foreground">{userName}</span>

          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

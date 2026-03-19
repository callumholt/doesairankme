"use client"

import { useEffect, useRef, useState } from "react"

type Heading = {
  id: string
  text: string
  level: 2 | 3
}

function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: Heading[] = []
  let match: RegExpExecArray | null

  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim()
    headings.push({ id, text, level })
  }

  return headings
}

function useActiveHeading(headingIds: string[]) {
  const [activeId, setActiveId] = useState<string>("")
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (headingIds.length === 0) return

    observerRef.current?.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" },
    )

    for (const id of headingIds) {
      const el = document.getElementById(id)
      if (el) observerRef.current.observe(el)
    }

    return () => observerRef.current?.disconnect()
  }, [headingIds])

  return activeId
}

export function TableOfContents({ content }: { content: string }) {
  const headings = extractHeadings(content)
  const [open, setOpen] = useState(false)
  const activeId = useActiveHeading(headings.map((h) => h.id))

  if (headings.length === 0) return null

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <nav className="hidden xl:block">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">On this page</p>
        <ul className="space-y-1.5">
          {headings.map((heading) => (
            <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}>
              <a
                href={`#${heading.id}`}
                className={`block text-sm leading-snug transition-colors hover:text-foreground ${
                  activeId === heading.id ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile: collapsible */}
      <div className="xl:hidden mb-8 rounded-lg border border-border/50 bg-card/30">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">On this page</span>
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <ul className="border-t border-border/50 px-4 py-3 space-y-2">
            {headings.map((heading) => (
              <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}>
                <a
                  href={`#${heading.id}`}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

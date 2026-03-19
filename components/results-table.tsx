"use client"

import { CheckCircle2, ChevronDown, ChevronRight, XCircle } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ScanResult } from "@/lib/db/schema"

function SourcesList({ sources, domain }: { sources: Array<{ url: string; title: string }>; domain: string }) {
  return (
    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
      {sources.slice(0, 5).map((source, i) => {
        const isTarget = source.url.includes(domain)
        return (
          <li key={`${source.url}-${i}`} className={isTarget ? "font-medium text-foreground" : ""}>
            <span className="font-mono text-xs text-muted-foreground/50 mr-2">{i + 1}.</span>
            {source.title || source.url}
            {isTarget && (
              <Badge
                variant="secondary"
                className="ml-2 text-xs bg-[#14F0C3]/15 text-[#14F0C3] border border-[#14F0C3]/20"
              >
                Your site
              </Badge>
            )}
          </li>
        )
      })}
      {sources.length > 5 && (
        <li className="text-muted-foreground/50 font-mono text-xs">...and {sources.length - 5} more</li>
      )}
    </ul>
  )
}

function FullResponsePanel({ result, domain }: { result: ScanResult; domain: string }) {
  const [showFullResponse, setShowFullResponse] = useState(false)
  const hasCitedSnippet = Boolean(result.citedSnippet)
  const hasResponseText = Boolean(result.responseText)

  return (
    <div className="space-y-3">
      {result.sources && result.sources.length > 0 && <SourcesList sources={result.sources} domain={domain} />}

      {hasCitedSnippet && (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Cited snippet</p>
          <blockquote className="border-l-2 border-[#14F0C3]/50 pl-3 text-sm text-muted-foreground italic">
            {result.citedSnippet}
          </blockquote>
        </div>
      )}

      {hasResponseText && (
        <div className="mt-3">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            onClick={() => setShowFullResponse((v) => !v)}
          >
            {showFullResponse ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {showFullResponse ? "Hide full AI response" : "Show full AI response"}
          </button>
          {showFullResponse && (
            <div className="mt-2 rounded-md border border-border/40 bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {result.responseText}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultRow({ result, domain }: { result: ScanResult; domain: string }) {
  const [expanded, setExpanded] = useState(false)
  const found = result.position !== null
  const hasExpandedContent =
    (result.sources && result.sources.length > 0) || Boolean(result.citedSnippet) || Boolean(result.responseText)

  return (
    <>
      <TableRow
        className={`transition-colors ${hasExpandedContent ? "cursor-pointer" : ""} ${found ? "hover:bg-[#14F0C3]/[0.03]" : "hover:bg-muted/30"}`}
        onClick={() => hasExpandedContent && setExpanded(!expanded)}
      >
        <TableCell className="w-8 text-muted-foreground/40">
          {hasExpandedContent ? (
            expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : null}
        </TableCell>
        <TableCell className="text-sm">{result.query}</TableCell>
        <TableCell className="text-center">
          {found ? (
            <span className="inline-flex items-center gap-1.5 text-[#14F0C3]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-mono font-bold tabular-nums">#{result.position}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground/40">
              <XCircle className="h-3.5 w-3.5" />
              <span className="font-mono text-xs">n/a</span>
            </span>
          )}
        </TableCell>
        <TableCell className="text-center font-mono text-sm tabular-nums text-muted-foreground">
          {result.sources?.length || 0}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/20">
          <TableCell />
          <TableCell colSpan={3}>
            <FullResponsePanel result={result} domain={domain} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export function ResultsTable({ results, domain }: { results: ScanResult[]; domain: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-[#14F0C3]/10 hover:bg-transparent">
          <TableHead className="w-8" />
          <TableHead className="text-xs uppercase tracking-wider">Query</TableHead>
          <TableHead className="text-center w-32 text-xs uppercase tracking-wider">Position</TableHead>
          <TableHead className="text-center w-24 text-xs uppercase tracking-wider">Sources</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <ResultRow key={result.id} result={result} domain={domain} />
        ))}
      </TableBody>
    </Table>
  )
}

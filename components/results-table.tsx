"use client"

import { CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ScanResult } from "@/lib/db/schema"

function SourcesList({ sources, domain }: { sources: Array<{ url: string; title: string }>; domain: string }) {
  return (
    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
      {sources.slice(0, 5).map((source, i) => {
        const isTarget = source.url.includes(domain)
        return (
          <li key={`${source.url}-${i}`} className={isTarget ? "font-medium text-foreground" : ""}>
            {i + 1}. {source.title || source.url}
            {isTarget && (
              <Badge variant="secondary" className="ml-2 text-xs bg-green-500/15 text-green-700 dark:text-green-400">
                Your site
              </Badge>
            )}
          </li>
        )
      })}
      {sources.length > 5 && <li>...and {sources.length - 5} more</li>}
    </ul>
  )
}

function ResultRow({ result, domain }: { result: ScanResult; domain: string }) {
  const [expanded, setExpanded] = useState(false)
  const found = result.position !== null

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(!expanded)}>
        <TableCell className="w-8">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TableCell>
        <TableCell>{result.query}</TableCell>
        <TableCell className="text-center">
          {found ? (
            <span className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              #{result.position}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1 text-muted-foreground">
              <XCircle className="h-4 w-4" />
              Not found
            </span>
          )}
        </TableCell>
        <TableCell className="text-center text-muted-foreground">{result.sources?.length || 0}</TableCell>
      </TableRow>
      {expanded && result.sources && result.sources.length > 0 && (
        <TableRow>
          <TableCell />
          <TableCell colSpan={3}>
            <SourcesList sources={result.sources} domain={domain} />
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
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Query</TableHead>
          <TableHead className="text-center w-32">Position</TableHead>
          <TableHead className="text-center w-24">Sources</TableHead>
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

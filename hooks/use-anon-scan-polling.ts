"use client"

import { useCallback, useEffect, useState } from "react"
import type { Scan, ScanResult } from "@/lib/db/schema"

type GatedScanResult = ScanResult & { gated: boolean }
type ScanWithResults = Scan & { results: GatedScanResult[] }

export function useAnonScanPolling(scanId: string) {
  const [scan, setScan] = useState<ScanWithResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScan = useCallback(async () => {
    try {
      const res = await fetch(`/api/scans/anonymous/${scanId}`)
      if (!res.ok) {
        setError("Failed to load scan")
        return
      }
      const data = await res.json()
      setScan(data)
    } catch {
      setError("Network error")
    } finally {
      setIsLoading(false)
    }
  }, [scanId])

  useEffect(() => {
    fetchScan()
    const interval = setInterval(() => {
      if (scan && ["complete", "failed"].includes(scan.status)) return
      fetchScan()
    }, 2000)
    return () => clearInterval(interval)
  }, [fetchScan, scan?.status])

  return { scan, isLoading, error }
}

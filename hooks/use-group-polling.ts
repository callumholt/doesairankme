"use client"

import { useCallback, useEffect, useState } from "react"
import type { Scan, ScanResult } from "@/lib/db/schema"

type ScanWithResults = Scan & { results: ScanResult[] }

export function useGroupPolling(groupId: string) {
  const [scans, setScans] = useState<ScanWithResults[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/scans/group/${groupId}`)
      if (!res.ok) {
        setError("Failed to load scans")
        return
      }
      const data = await res.json()
      setScans(data)
    } catch {
      setError("Network error")
    } finally {
      setIsLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    fetchGroup()
    const interval = setInterval(() => {
      const allDone = scans.length > 0 && scans.every((s) => ["complete", "failed"].includes(s.status))
      if (allDone) return
      fetchGroup()
    }, 2000)
    return () => clearInterval(interval)
  }, [fetchGroup, scans])

  return { scans, isLoading, error }
}

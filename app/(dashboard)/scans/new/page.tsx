"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NewScanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    let url = formData.get("url") as string
    const provider = formData.get("provider") as string
    const queryCount = parseInt(formData.get("queryCount") as string, 10)

    // Add https:// if no protocol
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    }

    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, provider, queryCount }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      const { id } = await res.json()
      router.push(`/scans/${id}`)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New Scan</CardTitle>
          <CardDescription>
            Enter a URL to test how discoverable it is to AI assistants.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input id="url" name="url" placeholder="https://example.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select name="provider" defaultValue="gemini">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="openai" disabled>
                    OpenAI (coming soon)
                  </SelectItem>
                  <SelectItem value="perplexity" disabled>
                    Perplexity (coming soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="queryCount">Number of Queries</Label>
              <Select name="queryCount" defaultValue="10">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 queries</SelectItem>
                  <SelectItem value="10">10 queries</SelectItem>
                  <SelectItem value="15">15 queries</SelectItem>
                  <SelectItem value="20">20 queries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Starting scan..." : "Start Scan"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

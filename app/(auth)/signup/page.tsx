"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Something went wrong")
      setLoading(false)
      return
    }

    // Auto sign in
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Account created but could not sign in. Please try logging in.")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center space-y-3 pb-2">
        <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary">
          doesairank.me
        </p>
        <CardTitle className="text-2xl font-semibold tracking-tight">Create account</CardTitle>
        <CardDescription>Start testing your AI discoverability</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          {error && (
            <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md py-2">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              required
              className="bg-background/50 border-border/50 focus-visible:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="bg-background/50 border-border/50 focus-visible:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="bg-background/50 border-border/50 focus-visible:ring-primary/50"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-teal"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

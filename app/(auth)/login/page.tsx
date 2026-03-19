"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
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
        <CardTitle className="text-2xl font-semibold tracking-tight">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access your dashboard</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          {error && (
            <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md py-2">
              {error}
            </p>
          )}
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
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

import { Suspense } from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain relative flex min-h-screen items-center justify-center bg-background p-4">
      {/* Faint teal radial gradient behind the card */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 50% 40% at 50% 50%, oklch(0.82 0.17 170 / 6%), transparent)",
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <Suspense>{children}</Suspense>
      </div>
    </div>
  )
}

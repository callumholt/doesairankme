import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"
import { Nav } from "@/components/nav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav userName={session.user.name} />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      </main>
    </div>
  )
}

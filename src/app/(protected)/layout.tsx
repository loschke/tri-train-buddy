import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Ironman Training Planner</h1>
          <nav className="flex gap-4">
            <a href="/dashboard" className="hover:underline">Dashboard</a>
            <a href="/metrics" className="hover:underline">Metrics</a>
            <a href="/progress" className="hover:underline">Progress</a>
            <a href="/settings" className="hover:underline">Settings</a>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

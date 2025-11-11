"use client"

import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Sign Out</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign out of your account on this device
            </p>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Navigate to important pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="/onboarding">Update Athlete Profile</a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="/metrics">Update Performance Metrics</a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="/plan/new">Generate New Training Cycle</a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ironman Training Planner MVP v1.0
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            AI-powered personalized training plans using Claude API
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Calendar, LogOut, Edit2, X, Check } from "lucide-react"
import { format } from "date-fns"

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const handleUpdateName = async () => {
    if (!newName.trim()) return

    setIsUpdating(true)
    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (response.ok) {
        setIsEditingName(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update name:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isPending) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  const user = session?.user

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              {user?.image ? (
                <img src={user.image} alt={user.name || 'User'} className="h-20 w-20 rounded-full" />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user?.name || 'User'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Name
            </Label>
            {isEditingName ? (
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={user?.name || 'Your name'}
                  disabled={isUpdating}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleUpdateName}
                  disabled={isUpdating || !newName.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setIsEditingName(false)
                    setNewName("")
                  }}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={user?.name || 'Not set'}
                  disabled
                  className="bg-muted"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setNewName(user?.name || '')
                    setIsEditingName(true)
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Email Field (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          {/* Account Created */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Member Since
            </Label>
            <Input
              value={user?.createdAt ? format(new Date(user.createdAt), 'PPP') : 'Unknown'}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Email Verification Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Email Verification</p>
              <p className="text-sm text-muted-foreground">
                {user?.emailVerified ? 'Your email is verified' : 'Your email is not verified'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              user?.emailVerified
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {user?.emailVerified ? 'Verified' : 'Not Verified'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links Card */}
      <Card>
        <CardHeader>
          <CardTitle>Training Settings</CardTitle>
          <CardDescription>Manage your training profile and metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="/onboarding">
              <Edit2 className="h-4 w-4 mr-2" />
              Update Athlete Profile
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="/metrics">
              <Edit2 className="h-4 w-4 mr-2" />
              Update Performance Metrics
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="/plan/new">
              <Calendar className="h-4 w-4 mr-2" />
              Generate New Training Cycle
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Account management actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Sign Out</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign out of your account on this device
            </p>
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About Card */}
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

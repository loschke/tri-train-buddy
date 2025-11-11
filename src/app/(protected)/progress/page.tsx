"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface WeeklyVolume {
  week: string
  run: number
  bike: number
  swim: number
  total: number
}

interface ProgressStats {
  totalSessions: number
  completedSessions: number
  completionRate: number
  weeklyVolumes: WeeklyVolume[]
}

export default function ProgressPage() {
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/progress')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading progress...</div>
  }

  if (!stats) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Progress Tracking</CardTitle>
            <CardDescription>No training data available yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Complete some training sessions to see your progress here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Progress Tracking</h1>
        <p className="text-muted-foreground">
          Monitor your training volume and completion rates
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overall Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.completionRate}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.completedSessions} of {stats.totalSessions} sessions completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalSessions}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Across all training cycles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {stats.completedSessions}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Sessions finished
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Volume Chart */}
      {stats.weeklyVolumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Training Volume</CardTitle>
            <CardDescription>Duration by discipline (minutes)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats.weeklyVolumes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="run" fill="#3b82f6" name="Run" />
                <Bar dataKey="bike" fill="#10b981" name="Bike" />
                <Bar dataKey="swim" fill="#06b6d4" name="Swim" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Discipline Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Discipline Summary</CardTitle>
          <CardDescription>Total time by sport</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.weeklyVolumes.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span className="font-medium">Running</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {stats.weeklyVolumes.reduce((sum, w) => sum + w.run, 0)} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="font-medium">Cycling</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {stats.weeklyVolumes.reduce((sum, w) => sum + w.bike, 0)} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-cyan-500"></div>
                    <span className="font-medium">Swimming</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {stats.weeklyVolumes.reduce((sum, w) => sum + w.swim, 0)} min
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function NewPlanPage() {
  const [feedback, setFeedback] = useState("")
  const [constraints, setConstraints] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleGenerate = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback,
          constraints,
          startDate,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate plan')
      }

      const data = await response.json()
      router.push(`/plan/${data.cycle.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Generate New Training Plan</CardTitle>
          <CardDescription>
            Create a personalized 14-day training cycle based on your current performance and goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The plan will cover 14 days starting from this date
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback from Last Cycle (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="How did the last cycle go? Any issues, injuries, or successes to note?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="constraints">Constraints for Next 14 Days (Optional)</Label>
            <Textarea
              id="constraints"
              placeholder="Any upcoming travel, events, or other constraints? (e.g., 'Business trip days 5-7, limited to indoor training')"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              rows={4}
            />
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Generating Plan with AI..." : "Generate 14-Day Plan"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            This will use AI to create a personalized plan based on your profile, metrics, and input
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { format } from "date-fns"

const metricsSchema = z.object({
  runThresholdPace: z.string().regex(/^\d{1,2}:\d{2}$/, "Format: MM:SS"),
  runToleranceKm: z.number().min(1).max(300),
  ftpWatts: z.number().min(50).max(500),
  swimPacePer100m: z.string().regex(/^\d{1,2}:\d{2}$/, "Format: MM:SS"),
  trainingReadiness: z.number().min(0).max(100).optional(),
  trainingLoad: z.string().optional(),
  notes: z.string().optional(),
})

type MetricsForm = z.infer<typeof metricsSchema>

export default function MetricsPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  const form = useForm<MetricsForm>({
    resolver: zodResolver(metricsSchema),
    defaultValues: {
      runThresholdPace: "5:50",
      runToleranceKm: 50,
      ftpWatts: 200,
      swimPacePer100m: "2:10",
    },
  })

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
        if (data.length > 0) {
          const latest = data[0]
          form.reset({
            runThresholdPace: latest.runThresholdPace,
            runToleranceKm: latest.runToleranceKm,
            ftpWatts: latest.ftpWatts,
            swimPacePer100m: latest.swimPacePer100m,
            trainingReadiness: latest.trainingReadiness || undefined,
            trainingLoad: latest.trainingLoad || undefined,
            notes: '',
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  const onSubmit = async (data: MetricsForm) => {
    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save metrics')

      setSuccess(true)
      fetchMetrics()

      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Metrics save error:', error)
      alert('Failed to save metrics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Metrics</h1>
        <p className="text-muted-foreground">
          Update your current fitness metrics to keep your training plans accurate
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Metrics</CardTitle>
          <CardDescription>
            Record your current performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="runThresholdPace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Run Threshold Pace (MM:SS per km)</FormLabel>
                      <FormControl>
                        <Input placeholder="5:50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="runToleranceKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Run Tolerance (km/week)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ftpWatts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FTP (watts)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="swimPacePer100m"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Swim Pace (MM:SS per 100m)</FormLabel>
                      <FormControl>
                        <Input placeholder="2:10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trainingReadiness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Readiness (0-100)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trainingLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Load (e.g., "214/300")</FormLabel>
                      <FormControl>
                        <Input placeholder="214/300" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any observations about your current fitness?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {success && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                  Metrics saved successfully!
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Metrics"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metrics History</CardTitle>
            <CardDescription>Your recent performance updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((metric) => (
                <div key={metric.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      {format(new Date(metric.recordedAt), 'PPP')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Run Pace:</span>
                      <span className="ml-1 font-medium">{metric.runThresholdPace}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Run Tolerance:</span>
                      <span className="ml-1 font-medium">{metric.runToleranceKm} km</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">FTP:</span>
                      <span className="ml-1 font-medium">{metric.ftpWatts}W</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Swim:</span>
                      <span className="ml-1 font-medium">{metric.swimPacePer100m}</span>
                    </div>
                  </div>
                  {metric.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{metric.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const athleteProfileSchema = z.object({
  raceDate: z.string().min(1, "Race date is required"),
  goalTime: z.string().regex(/^\d{1,2}:\d{2}:\d{2}$/, "Format: HH:MM:SS"),
  mondayRest: z.boolean().default(true),
  weekendLong: z.boolean().default(true),
  minBikePerWeek: z.number().min(1).max(7),
  maxBikePerWeek: z.number().min(1).max(7),
  minRunPerWeek: z.number().min(1).max(7),
  maxRunPerWeek: z.number().min(1).max(7),
  maxSwimPerWeek: z.number().min(0).max(7),
  gymPerWeek: z.number().min(0).max(7),
})

const metricsSchema = z.object({
  runThresholdPace: z.string().regex(/^\d{1,2}:\d{2}$/, "Format: MM:SS"),
  runToleranceKm: z.number().min(1).max(300),
  ftpWatts: z.number().min(50).max(500),
  swimPacePer100m: z.string().regex(/^\d{1,2}:\d{2}$/, "Format: MM:SS"),
  trainingReadiness: z.number().min(0).max(100).optional(),
  trainingLoad: z.string().optional(),
  notes: z.string().optional(),
})

type AthleteProfileForm = z.infer<typeof athleteProfileSchema>
type MetricsForm = z.infer<typeof metricsSchema>

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<AthleteProfileForm | null>(null)
  const router = useRouter()

  const profileForm = useForm<AthleteProfileForm>({
    resolver: zodResolver(athleteProfileSchema),
    defaultValues: {
      goalTime: "12:00:00",
      mondayRest: true,
      weekendLong: true,
      minBikePerWeek: 2,
      maxBikePerWeek: 4,
      minRunPerWeek: 2,
      maxRunPerWeek: 4,
      maxSwimPerWeek: 1,
      gymPerWeek: 2,
    },
  })

  const metricsForm = useForm<MetricsForm>({
    resolver: zodResolver(metricsSchema),
    defaultValues: {
      runThresholdPace: "5:50",
      runToleranceKm: 50,
      ftpWatts: 200,
      swimPacePer100m: "2:10",
    },
  })

  const onProfileSubmit = async (data: AthleteProfileForm) => {
    setProfileData(data)
    setStep(2)
  }

  const onMetricsSubmit = async (data: MetricsForm) => {
    if (!profileData) return

    setLoading(true)
    try {
      // Save athlete profile
      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raceDate: profileData.raceDate,
          goalTime: profileData.goalTime,
          trainingRules: {
            mondayRest: profileData.mondayRest,
            weekendLong: profileData.weekendLong,
            minBikePerWeek: profileData.minBikePerWeek,
            maxBikePerWeek: profileData.maxBikePerWeek,
            minRunPerWeek: profileData.minRunPerWeek,
            maxRunPerWeek: profileData.maxRunPerWeek,
            maxSwimPerWeek: profileData.maxSwimPerWeek,
            gymPerWeek: profileData.gymPerWeek,
          },
        }),
      })

      if (!profileRes.ok) throw new Error('Failed to save profile')

      // Save metrics
      const metricsRes = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!metricsRes.ok) throw new Error('Failed to save metrics')

      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Welcome! Let's set up your training plan</CardTitle>
          <CardDescription>
            {step === 1 ? "Step 1 of 2: Athlete Profile" : "Step 2 of 2: Performance Metrics"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <FormField
                  control={profileForm.control}
                  name="raceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Race Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="goalTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Time (HH:MM:SS)</FormLabel>
                      <FormControl>
                        <Input placeholder="12:00:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Training Rules</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="minBikePerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Bike/Week</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="maxBikePerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Bike/Week</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="minRunPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Run/Week</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="maxRunPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Run/Week</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="maxSwimPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Swim/Week</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="gymPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gym/Week</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">Next Step</Button>
              </form>
            </Form>
          )}

          {step === 2 && (
            <Form {...metricsForm}>
              <form onSubmit={metricsForm.handleSubmit(onMetricsSubmit)} className="space-y-6">
                <FormField
                  control={metricsForm.control}
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
                  control={metricsForm.control}
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
                  control={metricsForm.control}
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
                  control={metricsForm.control}
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
                  control={metricsForm.control}
                  name="trainingReadiness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Readiness (0-100, optional)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={metricsForm.control}
                  name="trainingLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Load (e.g., "214/300", optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="214/300" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={metricsForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full">
                    Back
                  </Button>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Completing..." : "Complete Setup"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

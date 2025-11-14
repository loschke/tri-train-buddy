# Dashboard with Insights

## Overview

The dashboard is the **central hub** where athletes land after login. It must be:
1. **Glanceable** - See today's workout and status at a glance
2. **Insightful** - AI-powered insights, not just data
3. **Motivating** - Progress, streaks, achievements
4. **Actionable** - Quick actions for common tasks
5. **Educational** - Learn something new each visit

---

## Dashboard Layout

```
┌────────────────────────────────────────────────┐
│  Header: Welcome + Streak + Quick Actions     │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Today's Workout │  │  AI Insight      │  │
│  │  (Hero Section)  │  │  (Context Card)  │  │
│  └──────────────────┘  └──────────────────┘  │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  Weekly Overview                         │ │
│  │  (7-day Calendar with Workouts)          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌────────┐│
│  │ Progress    │  │ Achievements│  │ Stats  ││
│  │ Chart       │  │ Recent      │  │ Summary││
│  └─────────────┘  └─────────────┘  └────────┘│
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  Educational Moment (Daily Tip)          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  Quick Links: Plan Settings, Wiki, etc. │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

---

## 1. Header Section

### Implementation

```typescript
// File: app/dashboard/components/dashboard-header.tsx

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Calendar } from 'lucide-react'

interface DashboardHeaderProps {
  userName: string
  currentStreak: number
  totalWorkouts: number
}

export function DashboardHeader({
  userName,
  currentStreak,
  totalWorkouts,
}: DashboardHeaderProps) {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Hallo' : 'Guten Abend'

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {userName}! 👋
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <span className="text-3xl">🔥</span>
              <div>
                <p className="text-sm opacity-90">Streak</p>
                <p className="text-lg font-semibold">{currentStreak} Tage</p>
              </div>
            </div>
            <div className="border-l border-white/30 h-12" />
            <div>
              <p className="text-sm opacity-90">Trainings absolviert</p>
              <p className="text-lg font-semibold">{totalWorkouts}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/constraints/add'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Constraint
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/plan/calendar'}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Kalender
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/settings'}
          >
            <Settings className="w-4 h-4 mr-2" />
            Einstellungen
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 2. Today's Workout (Hero Section)

### Design

```typescript
// File: app/dashboard/components/todays-workout.tsx

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PlayCircle,
  CheckCircle,
  Clock,
  Zap,
  BookOpen,
} from 'lucide-react'
import { Workout } from '@prisma/client'

interface TodaysWorkoutProps {
  workout: Workout | null
  hasCompletedToday: boolean
}

export function TodaysWorkout({
  workout,
  hasCompletedToday,
}: TodaysWorkoutProps) {
  if (!workout) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Heute ist Ruhetag! 🛌</h3>
        <p className="text-gray-600">
          Erholung ist ein wichtiger Teil des Trainings. Genieße deinen freien Tag!
        </p>
      </Card>
    )
  }

  if (hasCompletedToday) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Training erledigt! 🎉</h3>
        <p className="text-gray-600 mb-4">
          Super gemacht! Du hast dein heutiges Training absolviert.
        </p>
        <Button
          variant="outline"
          onClick={() => (window.location.href = `/workouts/${workout.id}/feedback`)}
        >
          Feedback geben
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
      {/* Workout Type Badge */}
      <div className="flex items-center justify-between mb-4">
        <Badge className="bg-blue-500 text-white px-3 py-1">
          {getDisciplineLabel(workout.discipline)}
        </Badge>
        <Badge variant="outline">{getIntensityLabel(workout.intensityZone)}</Badge>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        {workout.title}
      </h2>

      {/* Metadata */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-5 h-5" />
          <span className="font-medium">{workout.durationMin} min</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Zap className="w-5 h-5" />
          <span className="font-medium">{workout.type}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-6">{workout.description}</p>

      {/* Educational Note */}
      {workout.isFirstOfType && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-sm font-semibold text-yellow-900 mb-1">
            ✨ Neuer Workout-Typ!
          </p>
          <p className="text-sm text-yellow-800">
            Das ist das erste Mal, dass du "{workout.type}" machst. Nimm dir Zeit, die Ausführung zu verstehen.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          onClick={() => (window.location.href = `/workouts/${workout.id}`)}
        >
          <PlayCircle className="w-5 h-5 mr-2" />
          Training starten
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => (window.location.href = `/workouts/${workout.id}/details`)}
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Details
        </Button>
      </div>
    </Card>
  )
}

function getDisciplineLabel(discipline: string): string {
  const labels: Record<string, string> = {
    RUN: '🏃 Laufen',
    BIKE: '🚴 Radfahren',
    SWIM: '🏊 Schwimmen',
    STRENGTH: '💪 Krafttraining',
    REST: '🛌 Ruhetag',
  }
  return labels[discipline] || discipline
}

function getIntensityLabel(zone: string | null): string {
  if (!zone) return 'Recovery'
  return zone
}
```

---

## 3. AI Insight Card

### Dynamic Insights Generation

```typescript
// File: app/dashboard/components/ai-insight.tsx

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'

interface AIInsight {
  type: 'trend' | 'warning' | 'tip' | 'achievement'
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
}

interface AIInsightCardProps {
  insight: AIInsight
}

export function AIInsightCard({ insight }: AIInsightCardProps) {
  const iconMap = {
    trend: <TrendingUp className="w-6 h-6" />,
    warning: <AlertTriangle className="w-6 h-6" />,
    tip: <Lightbulb className="w-6 h-6" />,
    achievement: <Brain className="w-6 h-6" />,
  }

  const colorMap = {
    trend: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    tip: 'bg-blue-50 border-blue-200',
    achievement: 'bg-purple-50 border-purple-200',
  }

  const badgeMap = {
    trend: 'bg-green-500',
    warning: 'bg-yellow-500',
    tip: 'bg-blue-500',
    achievement: 'bg-purple-500',
  }

  return (
    <Card className={`p-6 border-2 ${colorMap[insight.type]}`}>
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${badgeMap[insight.type]} text-white`}
        >
          {iconMap[insight.type]}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${badgeMap[insight.type]} text-white`}>
              AI Insight
            </Badge>
            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
          </div>

          <p className="text-sm text-gray-700 mb-3">{insight.message}</p>

          {insight.action && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = insight.action!.href)}
            >
              {insight.action.label}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
```

### Backend: Generate Daily Insight

```typescript
// File: app/lib/ai/daily-insights.ts

import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateDailyInsight(userId: string): Promise<AIInsight> {
  // Gather context
  const [recentFeedback, currentPlan, athleteProfile, preferences] =
    await Promise.all([
      prisma.workoutFeedback.findMany({
        where: { userId },
        include: { workout: true },
        orderBy: { createdAt: 'desc' },
        take: 7,
      }),
      prisma.trainingPlan.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { workouts: true },
      }),
      prisma.athleteProfile.findUnique({
        where: { userId },
      }),
      prisma.athletePreference.findMany({
        where: { userId, active: true },
      }),
    ])

  if (!athleteProfile) {
    throw new Error('No athlete profile found')
  }

  // Calculate stats
  const completionRate = calculateCompletionRate(recentFeedback)
  const averageFeeling = calculateAverageFeeling(recentFeedback)
  const currentStreak = await calculateStreak(userId)

  // Detect patterns
  const overtrainingRisk = detectOvertrainingRisk(recentFeedback)
  const progressTrend = detectProgressTrend(recentFeedback)

  // Generate insight with AI
  const systemPrompt = `You are an AI coach analyzing an athlete's training data to generate a daily insight.

**Athlete Context:**
- Goal: ${athleteProfile.goal}
- Current Phase: ${currentPlan?.phase || 'Unknown'}
- Recent Completion Rate: ${completionRate}%
- Average Feeling (last 7 workouts): ${averageFeeling}/5
- Current Streak: ${currentStreak} days

**Recent Feedback:**
${recentFeedback
  .map(
    (fb) =>
      `- ${fb.workout.type}: Feeling ${fb.feeling}/5, Difficulty ${fb.perceivedDifficulty}/10`
  )
  .join('\n')}

**Detected Patterns:**
${overtrainingRisk ? '- WARNING: Overtraining risk detected' : ''}
${progressTrend ? `- Progress trend: ${progressTrend}` : ''}

**Task:**
Generate ONE daily insight for the dashboard. Choose the most important message:

1. **Warning** - If overtraining risk or injury concern
2. **Trend** - If showing clear progress or improvement
3. **Tip** - If athlete could benefit from specific advice
4. **Achievement** - If recent milestone or accomplishment

Return JSON:
{
  "type": "trend|warning|tip|achievement",
  "title": "Short headline (5-8 words)",
  "message": "1-2 sentences explaining the insight",
  "action": {
    "label": "Button text",
    "href": "/relevant-page"
  }
}

**Examples:**

{
  "type": "warning",
  "title": "Erholungszeit könnte zu kurz sein",
  "message": "Deine letzten 3 Trainings fühlten sich alle schwer an. Das könnte ein Zeichen sein, dass du mehr Erholung brauchst.",
  "action": {
    "label": "Feedback ansehen",
    "href": "/insights"
  }
}

{
  "type": "trend",
  "title": "Starke Woche! 💪",
  "message": "Du hast alle 5 geplanten Trainings absolviert und die Intensität gut toleriert. Weiter so!",
  "action": null
}

Return only the JSON, no markdown.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    temperature: 0.5,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: 'Generate the daily insight.',
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No response from AI')
  }

  const insight = JSON.parse(textContent.text)
  return insight
}

function calculateCompletionRate(feedback: any[]): number {
  if (feedback.length === 0) return 0
  const completed = feedback.filter((fb) => fb.workout.completed).length
  return Math.round((completed / feedback.length) * 100)
}

function calculateAverageFeeling(feedback: any[]): number {
  if (feedback.length === 0) return 0
  const sum = feedback.reduce((acc, fb) => acc + fb.feeling, 0)
  return +(sum / feedback.length).toFixed(1)
}

async function calculateStreak(userId: string): Promise<number> {
  // Get all completed workouts ordered by date DESC
  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      completed: true,
    },
    orderBy: { date: 'desc' },
  })

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const workout of workouts) {
    const workoutDate = new Date(workout.date)
    workoutDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor(
      (currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === streak || diffDays === streak + 1) {
      streak = diffDays + 1
      currentDate = workoutDate
    } else {
      break
    }
  }

  return streak
}

function detectOvertrainingRisk(feedback: any[]): boolean {
  const recentFeedback = feedback.slice(0, 5)
  const lowFeelings = recentFeedback.filter((fb) => fb.feeling <= 2).length
  return lowFeelings >= 3
}

function detectProgressTrend(feedback: any[]): string | null {
  if (feedback.length < 5) return null

  const recent = feedback.slice(0, 3)
  const older = feedback.slice(3, 6)

  const recentAvg =
    recent.reduce((sum, fb) => sum + fb.feeling, 0) / recent.length
  const olderAvg = older.reduce((sum, fb) => sum + fb.feeling, 0) / older.length

  if (recentAvg > olderAvg + 0.5) return 'improving'
  if (recentAvg < olderAvg - 0.5) return 'declining'
  return 'stable'
}
```

---

## 4. Weekly Overview Calendar

```typescript
// File: app/dashboard/components/weekly-overview.tsx

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, Clock } from 'lucide-react'
import { Workout } from '@prisma/client'

interface WeeklyOverviewProps {
  workouts: Workout[]
  startDate: Date
}

export function WeeklyOverview({ workouts, startDate }: WeeklyOverviewProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    return date
  })

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Diese Woche</h3>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const dayWorkouts = workouts.filter((w) => {
            const workoutDate = new Date(w.date)
            return workoutDate.toDateString() === day.toDateString()
          })

          const isToday = day.toDateString() === new Date().toDateString()
          const isPast = day < new Date()

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border-2 ${
                isToday
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-center mb-2">
                <p className="text-xs text-gray-500 uppercase">
                  {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                </p>
                <p
                  className={`text-lg font-semibold ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>

              {dayWorkouts.length > 0 ? (
                <div className="space-y-1">
                  {dayWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className={`p-2 rounded text-xs ${
                        workout.completed
                          ? 'bg-green-100 text-green-800'
                          : isPast
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {workout.completed ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        <span className="truncate">{workout.title}</span>
                      </div>
                      <p className="text-xs opacity-75 mt-1">
                        {workout.durationMin} min
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-12">
                  <p className="text-xs text-gray-400">Ruhetag</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
```

---

## 5. Dashboard Page Integration

```typescript
// File: app/dashboard/page.tsx

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardHeader } from './components/dashboard-header'
import { TodaysWorkout } from './components/todays-workout'
import { AIInsightCard } from './components/ai-insight'
import { WeeklyOverview } from './components/weekly-overview'
import { generateDailyInsight } from '@/lib/ai/daily-insights'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/login')
  }

  // Parallel data fetching
  const [profile, todaysWorkout, weekWorkouts, totalWorkouts, currentStreak] =
    await Promise.all([
      prisma.athleteProfile.findUnique({
        where: { userId: session.user.id },
      }),
      getTodaysWorkout(session.user.id),
      getWeekWorkouts(session.user.id),
      prisma.workout.count({
        where: { userId: session.user.id, completed: true },
      }),
      calculateStreak(session.user.id),
    ])

  if (!profile?.onboardingCompleted) {
    redirect('/onboarding')
  }

  // Generate AI insight
  const insight = await generateDailyInsight(session.user.id)

  const hasCompletedToday = todaysWorkout?.completed || false

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <DashboardHeader
        userName={session.user.name || 'Athlet'}
        currentStreak={currentStreak}
        totalWorkouts={totalWorkouts}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout - 2 columns */}
        <div className="lg:col-span-2">
          <TodaysWorkout
            workout={todaysWorkout}
            hasCompletedToday={hasCompletedToday}
          />
        </div>

        {/* AI Insight - 1 column */}
        <div>
          <AIInsightCard insight={insight} />
        </div>
      </div>

      {/* Weekly Overview */}
      <WeeklyOverview
        workouts={weekWorkouts}
        startDate={getMonday(new Date())}
      />

      {/* Additional sections: Progress Chart, Achievements, etc. */}
    </div>
  )
}

async function getTodaysWorkout(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return prisma.workout.findFirst({
    where: {
      userId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  })
}

async function getWeekWorkouts(userId: string) {
  const monday = getMonday(new Date())
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 7)

  return prisma.workout.findMany({
    where: {
      userId,
      date: {
        gte: monday,
        lt: sunday,
      },
    },
    orderBy: { date: 'asc' },
  })
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
```

---

## Summary

The dashboard provides:
1. **Glanceable overview** - Today's workout + key stats
2. **AI insights** - Smart analysis, not just data
3. **Weekly context** - See the full week at a glance
4. **Motivation** - Streaks, achievements, progress
5. **Quick actions** - Common tasks accessible

**Key Metrics:**
- < 2 seconds to understand today's task
- AI insight changes daily based on patterns
- Streak visualization for motivation
- One-click access to workout details

---

**Next:** Workout Tracking & Feedback

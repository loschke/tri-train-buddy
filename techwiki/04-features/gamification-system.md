# Gamification System

## Overview

Gamification keeps athletes motivated during the long journey to their goal. The system should feel **rewarding without being gimmicky** - celebrating real progress and consistency.

**Core Philosophy:**
1. **Celebrate Effort** - Not just performance
2. **Build Habits** - Reward consistency over intensity
3. **Educational** - Achievements tied to learning moments
4. **Non-Intrusive** - Subtle, not annoying
5. **Progressive** - New challenges unlock as you grow

---

## Gamification Elements

```
┌──────────────────────────────────────┐
│  Streaks (Daily Consistency)        │
│  - Current streak                    │
│  - Longest streak                    │
│  - Streak protection (1x/month)     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Achievements (Milestones)           │
│  - First workout                     │
│  - Streaks (7, 30, 100 days)        │
│  - Volume milestones                 │
│  - Learning milestones               │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Progress Visualization              │
│  - Weeks to goal countdown           │
│  - Training phase progress           │
│  - Volume accumulation               │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Social (Future)                     │
│  - Share achievements                │
│  - Training clubs                    │
│  - Leaderboards (opt-in)            │
└──────────────────────────────────────┘
```

---

## 1. Achievements System

### Achievement Types

```typescript
// File: app/lib/gamification/achievement-types.ts

export enum AchievementType {
  // First Steps
  FIRST_PLAN = 'first-plan',
  FIRST_WORKOUT = 'first-workout',
  FIRST_WEEK_COMPLETE = 'first-week-complete',

  // Streaks
  STREAK_7 = 'streak-7',
  STREAK_30 = 'streak-30',
  STREAK_100 = 'streak-100',
  STREAK_365 = 'streak-365',

  // Consistency
  WEEK_PERFECT = 'week-perfect', // Completed all workouts
  MONTH_CONSISTENT = 'month-consistent', // 90% completion
  PLAN_COMPLETED = 'plan-completed', // Finished a 2-week cycle

  // Workout Types (First Time)
  FIRST_LONG_RUN = 'first-long-run',
  FIRST_INTERVALS = 'first-intervals',
  FIRST_THRESHOLD = 'first-threshold',
  FIRST_BRICK = 'first-brick',

  // Volume Milestones
  TOTAL_100KM = 'total-100km',
  TOTAL_500KM = 'total-500km',
  TOTAL_1000KM = 'total-1000km',
  TOTAL_50H = 'total-50h',
  TOTAL_100H = 'total-100h',

  // Learning
  FIRST_CONCEPT = 'first-concept',
  TEN_CONCEPTS = 'ten-concepts',
  CORE_MASTER = 'core-master',

  // Goal Achievement
  GOAL_ACHIEVED = 'goal-achieved',
  GOAL_EXCEEDED = 'goal-exceeded',
}

export interface AchievementDefinition {
  id: AchievementType
  tier: 1 | 2 | 3 // Bronze, Silver, Gold
  title: string
  description: string
  icon: string
  category: 'first-steps' | 'consistency' | 'volume' | 'learning' | 'mastery'
  points: number
}

export const ACHIEVEMENT_DEFINITIONS: Record<
  AchievementType,
  AchievementDefinition
> = {
  [AchievementType.FIRST_PLAN]: {
    id: AchievementType.FIRST_PLAN,
    tier: 1,
    title: 'Los geht\'s! 🚀',
    description: 'Erster Trainingsplan erstellt',
    icon: '🚀',
    category: 'first-steps',
    points: 10,
  },
  [AchievementType.FIRST_WORKOUT]: {
    id: AchievementType.FIRST_WORKOUT,
    tier: 1,
    title: 'Erster Schritt',
    description: 'Erstes Training absolviert',
    icon: '👟',
    category: 'first-steps',
    points: 20,
  },
  [AchievementType.STREAK_7]: {
    id: AchievementType.STREAK_7,
    tier: 1,
    title: 'Woche durch! 🔥',
    description: '7 Tage am Stück trainiert',
    icon: '🔥',
    category: 'consistency',
    points: 50,
  },
  [AchievementType.STREAK_30]: {
    id: AchievementType.STREAK_30,
    tier: 2,
    title: 'Monat Master 💪',
    description: '30 Tage am Stück trainiert',
    icon: '💪',
    category: 'consistency',
    points: 200,
  },
  [AchievementType.STREAK_100]: {
    id: AchievementType.STREAK_100,
    tier: 3,
    title: '100-Tage-Legende 🏆',
    description: '100 Tage am Stück trainiert',
    icon: '🏆',
    category: 'consistency',
    points: 1000,
  },
  [AchievementType.TOTAL_100KM]: {
    id: AchievementType.TOTAL_100KM,
    tier: 1,
    title: 'Centurion',
    description: '100km total gelaufen',
    icon: '🏃',
    category: 'volume',
    points: 100,
  },
  [AchievementType.FIRST_CONCEPT]: {
    id: AchievementType.FIRST_CONCEPT,
    tier: 1,
    title: 'Wissbegierig 📖',
    description: 'Erstes Trainingskonzept gelernt',
    icon: '📖',
    category: 'learning',
    points: 30,
  },
  [AchievementType.CORE_MASTER]: {
    id: AchievementType.CORE_MASTER,
    tier: 3,
    title: 'Trainings-Experte 🎓',
    description: 'Alle Kern-Konzepte gemeistert',
    icon: '🎓',
    category: 'mastery',
    points: 500,
  },
  // ... more achievements
}
```

---

## 2. Achievement Engine

### Detection & Unlocking

```typescript
// File: app/lib/gamification/achievement-engine.ts

import { prisma } from '@/lib/prisma'
import { AchievementType, ACHIEVEMENT_DEFINITIONS } from './achievement-types'

export class AchievementEngine {
  async checkAndUnlockAchievements(
    userId: string,
    trigger: 'workout_completed' | 'plan_completed' | 'concept_learned'
  ): Promise<Achievement[]> {
    const newAchievements: Achievement[] = []

    switch (trigger) {
      case 'workout_completed':
        newAchievements.push(
          ...(await this.checkWorkoutAchievements(userId))
        )
        break
      case 'plan_completed':
        newAchievements.push(...(await this.checkPlanAchievements(userId)))
        break
      case 'concept_learned':
        newAchievements.push(
          ...(await this.checkLearningAchievements(userId))
        )
        break
    }

    // Unlock and save
    for (const achievement of newAchievements) {
      await this.unlockAchievement(userId, achievement)
    }

    return newAchievements
  }

  private async checkWorkoutAchievements(
    userId: string
  ): Promise<Achievement[]> {
    const achievements: Achievement[] = []

    // Get completed workouts
    const completedWorkouts = await prisma.workout.count({
      where: { userId, completed: true },
    })

    // First workout
    if (completedWorkouts === 1) {
      achievements.push(this.getAchievement(AchievementType.FIRST_WORKOUT))
    }

    // Streaks
    const currentStreak = await this.calculateStreak(userId)
    if (
      currentStreak === 7 &&
      !(await this.hasAchievement(userId, AchievementType.STREAK_7))
    ) {
      achievements.push(this.getAchievement(AchievementType.STREAK_7))
    }
    if (
      currentStreak === 30 &&
      !(await this.hasAchievement(userId, AchievementType.STREAK_30))
    ) {
      achievements.push(this.getAchievement(AchievementType.STREAK_30))
    }
    if (
      currentStreak === 100 &&
      !(await this.hasAchievement(userId, AchievementType.STREAK_100))
    ) {
      achievements.push(this.getAchievement(AchievementType.STREAK_100))
    }

    // First time doing specific workout types
    const lastWorkout = await prisma.workout.findFirst({
      where: { userId, completed: true },
      orderBy: { completedAt: 'desc' },
    })

    if (lastWorkout?.isFirstOfType) {
      if (lastWorkout.type === 'LONG') {
        achievements.push(this.getAchievement(AchievementType.FIRST_LONG_RUN))
      }
      if (lastWorkout.type === 'INTERVALS') {
        achievements.push(this.getAchievement(AchievementType.FIRST_INTERVALS))
      }
    }

    // Volume milestones
    const totalDistance = await this.calculateTotalDistance(userId)
    if (
      totalDistance >= 100 &&
      !(await this.hasAchievement(userId, AchievementType.TOTAL_100KM))
    ) {
      achievements.push(this.getAchievement(AchievementType.TOTAL_100KM))
    }

    return achievements
  }

  private async calculateStreak(userId: string): Promise<number> {
    const workouts = await prisma.workout.findMany({
      where: { userId, completed: true },
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

  private async calculateTotalDistance(userId: string): Promise<number> {
    const workouts = await prisma.workout.findMany({
      where: {
        userId,
        completed: true,
        discipline: 'RUN',
      },
    })

    // Estimate distance from duration (rough average pace)
    return workouts.reduce((total, w) => {
      const estimatedKm = w.durationMin / 6 // Assume 6min/km avg
      return total + estimatedKm
    }, 0)
  }

  private async hasAchievement(
    userId: string,
    type: AchievementType
  ): Promise<boolean> {
    const achievement = await prisma.achievement.findFirst({
      where: {
        userId,
        type: type as any,
      },
    })
    return !!achievement
  }

  private getAchievement(type: AchievementType): Achievement {
    return ACHIEVEMENT_DEFINITIONS[type] as any
  }

  private async unlockAchievement(
    userId: string,
    achievement: Achievement
  ): Promise<void> {
    await prisma.achievement.create({
      data: {
        userId,
        type: achievement.id as any,
        tier: achievement.tier,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        unlockedAt: new Date(),
        viewed: false,
      },
    })

    // Could trigger notification/toast here
  }

  private async checkPlanAchievements(
    userId: string
  ): Promise<Achievement[]> {
    // Check if user completed a full training plan
    const achievements: Achievement[] = []

    const completedPlans = await prisma.trainingPlan.count({
      where: { userId, status: 'COMPLETED' },
    })

    if (
      completedPlans === 1 &&
      !(await this.hasAchievement(userId, AchievementType.PLAN_COMPLETED))
    ) {
      achievements.push(this.getAchievement(AchievementType.PLAN_COMPLETED))
    }

    return achievements
  }

  private async checkLearningAchievements(
    userId: string
  ): Promise<Achievement[]> {
    const achievements: Achievement[] = []

    const learnedConcepts = await prisma.athleteKnowledge.count({
      where: { userId },
    })

    if (
      learnedConcepts === 1 &&
      !(await this.hasAchievement(userId, AchievementType.FIRST_CONCEPT))
    ) {
      achievements.push(this.getAchievement(AchievementType.FIRST_CONCEPT))
    }

    if (
      learnedConcepts === 10 &&
      !(await this.hasAchievement(userId, AchievementType.TEN_CONCEPTS))
    ) {
      achievements.push(this.getAchievement(AchievementType.TEN_CONCEPTS))
    }

    return achievements
  }
}

export const achievementEngine = new AchievementEngine()
```

---

## 3. Achievement Notification

### Toast Notification

```typescript
// File: app/components/achievements/achievement-toast.tsx

'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Trophy } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  tier: number
}

interface AchievementToastProps {
  achievement: Achievement
  onDismiss: () => void
}

export function AchievementToast({
  achievement,
  onDismiss,
}: AchievementToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setVisible(true), 100)

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  const tierColors = {
    1: 'bg-amber-50 border-amber-200',
    2: 'bg-gray-50 border-gray-300',
    3: 'bg-yellow-50 border-yellow-400',
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Card
        className={`p-6 border-2 shadow-2xl ${
          tierColors[achievement.tier as keyof typeof tierColors]
        } max-w-sm`}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-4xl shadow-lg">
            {achievement.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h3 className="font-bold text-gray-900">Achievement unlocked!</h3>
            </div>
            <h4 className="font-semibold text-lg text-gray-900 mb-1">
              {achievement.title}
            </h4>
            <p className="text-sm text-gray-600">{achievement.description}</p>
          </div>

          {/* Close */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setVisible(false)
              setTimeout(onDismiss, 300)
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

### Achievement Page

```typescript
// File: app/achievements/page.tsx

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Lock } from 'lucide-react'

export default async function AchievementsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/login')
  }

  const [unlockedAchievements, totalPoints] = await Promise.all([
    prisma.achievement.findMany({
      where: { userId: session.user.id },
      orderBy: { unlockedAt: 'desc' },
    }),
    prisma.achievement.aggregate({
      where: { userId: session.user.id },
      _sum: { points: true },
    }),
  ])

  const allAchievements = Object.values(ACHIEVEMENT_DEFINITIONS)
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.type))

  // Group by category
  const categories = {
    'first-steps': allAchievements.filter((a) => a.category === 'first-steps'),
    consistency: allAchievements.filter((a) => a.category === 'consistency'),
    volume: allAchievements.filter((a) => a.category === 'volume'),
    learning: allAchievements.filter((a) => a.category === 'learning'),
    mastery: allAchievements.filter((a) => a.category === 'mastery'),
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Deine Achievements</h1>
            <p className="text-yellow-100">
              {unlockedAchievements.length} von {allAchievements.length}{' '}
              freigeschaltet
            </p>
          </div>
          <div className="text-right">
            <Trophy className="w-16 h-16 mb-2 mx-auto" />
            <p className="text-4xl font-bold">{totalPoints._sum.points || 0}</p>
            <p className="text-sm text-yellow-100">Punkte</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <Progress
            value={(unlockedAchievements.length / allAchievements.length) * 100}
            className="h-3 bg-yellow-700"
          />
        </div>
      </div>

      {/* Categories */}
      {Object.entries(categories).map(([category, achievements]) => (
        <div key={category}>
          <h2 className="text-xl font-semibold mb-4 capitalize">
            {getCategoryLabel(category)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const isUnlocked = unlockedIds.has(achievement.id as any)
              const unlockedData = unlockedAchievements.find(
                (a) => a.type === achievement.id
              )

              return (
                <Card
                  key={achievement.id}
                  className={`p-6 ${
                    isUnlocked
                      ? 'border-2 border-yellow-400 bg-yellow-50'
                      : 'opacity-50 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                          : 'bg-gray-200'
                      }`}
                    >
                      {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-400" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <Badge variant={getTierBadge(achievement.tier)}>
                          {getTierLabel(achievement.tier)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {achievement.points} Punkte
                        </p>
                        {isUnlocked && unlockedData && (
                          <p className="text-xs text-gray-500">
                            {unlockedData.unlockedAt.toLocaleDateString('de-DE')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'first-steps': 'Erste Schritte',
    consistency: 'Konstanz',
    volume: 'Volumen',
    learning: 'Lernen',
    mastery: 'Meisterschaft',
  }
  return labels[category] || category
}

function getTierLabel(tier: number): string {
  return ['Bronze', 'Silber', 'Gold'][tier - 1]
}

function getTierBadge(tier: number): 'default' | 'secondary' | 'destructive' {
  return ['default', 'secondary', 'destructive'][tier - 1] as any
}
```

---

## 4. Streak System

### Streak Tracking

```typescript
// File: app/lib/gamification/streak-tracker.ts

export class StreakTracker {
  async getCurrentStreak(userId: string): Promise<number> {
    const workouts = await prisma.workout.findMany({
      where: { userId, completed: true },
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

  async getLongestStreak(userId: string): Promise<number> {
    const workouts = await prisma.workout.findMany({
      where: { userId, completed: true },
      orderBy: { date: 'asc' },
    })

    let longestStreak = 0
    let currentStreak = 0
    let lastDate: Date | null = null

    for (const workout of workouts) {
      const workoutDate = new Date(workout.date)
      workoutDate.setHours(0, 0, 0, 0)

      if (lastDate) {
        const diffDays = Math.floor(
          (workoutDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (diffDays === 1) {
          currentStreak++
        } else {
          longestStreak = Math.max(longestStreak, currentStreak)
          currentStreak = 1
        }
      } else {
        currentStreak = 1
      }

      lastDate = workoutDate
    }

    return Math.max(longestStreak, currentStreak)
  }

  async getStreakProtectionAvailable(userId: string): Promise<boolean> {
    // Allow 1 streak protection per month
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const protectionsUsed = await prisma.streakProtection.count({
      where: {
        userId,
        usedAt: {
          gte: thisMonth,
        },
      },
    })

    return protectionsUsed === 0
  }

  async useStreakProtection(userId: string): Promise<void> {
    await prisma.streakProtection.create({
      data: {
        userId,
        usedAt: new Date(),
      },
    })
  }
}
```

---

## 5. Progress Visualization

### Goal Countdown

```typescript
// File: app/components/gamification/goal-countdown.tsx

'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Calendar, Target } from 'lucide-react'

interface GoalCountdownProps {
  goalDate: Date
  goalName: string
  currentPhase: string
  weeksCompleted: number
  totalWeeks: number
}

export function GoalCountdown({
  goalDate,
  goalName,
  currentPhase,
  weeksCompleted,
  totalWeeks,
}: GoalCountdownProps) {
  const now = new Date()
  const daysUntilGoal = Math.floor(
    (goalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  const weeksUntilGoal = Math.ceil(daysUntilGoal / 7)

  const progressPercent = (weeksCompleted / totalWeeks) * 100

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Dein Ziel</h3>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">{goalName}</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{daysUntilGoal}</p>
          <p className="text-sm text-gray-600">Tage</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{weeksUntilGoal}</p>
          <p className="text-sm text-gray-600">Wochen</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Phase: {currentPhase}</span>
          <span className="font-semibold text-gray-900">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Woche {weeksCompleted} von {totalWeeks}
      </p>
    </Card>
  )
}
```

---

## Summary

The gamification system:
1. **Celebrates progress** - Achievements for milestones
2. **Builds habits** - Streak tracking and rewards
3. **Motivates** - Visual progress toward goal
4. **Educates** - Learning achievements
5. **Feels rewarding** - Toast notifications, points system

**Key Principles:**
- Subtle, not annoying
- Celebrate effort, not just performance
- Tied to real progress
- Progressive unlocking
- Optional social features

---

**Next:** UX Patterns Documentation

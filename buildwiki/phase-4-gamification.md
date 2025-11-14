# Phase 4: Gamification & Motivation

## Ziel
Achievement System, Streaks, Progress Visualization für User Engagement.

**Duration:** 1 Woche
**Effort:** ~30-40 Stunden
**Risk Level:** 🟢 Low (Nice-to-have Features)

---

## Voraussetzungen

- ✅ Phase 1, 2, 3 erfolgreich abgeschlossen
- ✅ User können Workouts absolvieren
- ✅ Feedback wird gespeichert

---

## Phase Milestones

### Milestone 4.1: Achievement System (Tag 1-3)
**Ziel:** Achievements werden getrackt und angezeigt

### Milestone 4.2: Streak Tracking (Tag 4-5)
**Ziel:** Streak calculation und Display

### Milestone 4.3: Progress Visualization (Tag 6-7)
**Ziel:** Goal progress und charts

---

## Milestone 4.1: Achievement System

**Reference:** `techwiki/04-features/gamification-system.md`

### Tasks

#### 4.1.1 Create Achievement Engine
**Estimated Time:** 2 hours

Erstelle `app/lib/gamification/achievement-engine.ts`:

```typescript
import { prisma } from '@/lib/prisma'

export enum AchievementType {
  FIRST_WORKOUT = 'first-workout',
  STREAK_7 = 'streak-7',
  STREAK_30 = 'streak-30',
  WEEK_PERFECT = 'week-perfect',
  TOTAL_100KM = 'total-100km',
  FIRST_CONCEPT = 'first-concept',
}

interface AchievementDefinition {
  id: AchievementType
  tier: 1 | 2 | 3
  title: string
  description: string
  icon: string
  points: number
}

const ACHIEVEMENTS: Record<AchievementType, AchievementDefinition> = {
  [AchievementType.FIRST_WORKOUT]: {
    id: AchievementType.FIRST_WORKOUT,
    tier: 1,
    title: 'Erster Schritt',
    description: 'Erstes Training absolviert',
    icon: '👟',
    points: 20,
  },
  [AchievementType.STREAK_7]: {
    id: AchievementType.STREAK_7,
    tier: 1,
    title: 'Woche durch! 🔥',
    description: '7 Tage am Stück trainiert',
    icon: '🔥',
    points: 50,
  },
  [AchievementType.STREAK_30]: {
    id: AchievementType.STREAK_30,
    tier: 2,
    title: 'Monat Master 💪',
    description: '30 Tage am Stück trainiert',
    icon: '💪',
    points: 200,
  },
  // ... more achievements
}

export class AchievementEngine {
  async checkWorkoutAchievements(userId: string): Promise<string[]> {
    const newAchievements: string[] = []

    const completedWorkouts = await prisma.workout.count({
      where: { userId, completed: true },
    })

    // First workout
    if (completedWorkouts === 1) {
      await this.unlockAchievement(userId, AchievementType.FIRST_WORKOUT)
      newAchievements.push('first-workout')
    }

    // Streaks
    const currentStreak = await this.calculateStreak(userId)
    if (currentStreak === 7 && !(await this.hasAchievement(userId, AchievementType.STREAK_7))) {
      await this.unlockAchievement(userId, AchievementType.STREAK_7)
      newAchievements.push('streak-7')
    }

    return newAchievements
  }

  async calculateStreak(userId: string): Promise<number> {
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

  private async unlockAchievement(
    userId: string,
    type: AchievementType
  ): Promise<void> {
    const achievement = ACHIEVEMENTS[type]

    await prisma.achievement.create({
      data: {
        userId,
        type: achievement.id as any,
        tier: achievement.tier,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
      },
    })
  }

  private async hasAchievement(
    userId: string,
    type: AchievementType
  ): Promise<boolean> {
    const achievement = await prisma.achievement.findFirst({
      where: { userId, type: type as any },
    })
    return !!achievement
  }
}

export const achievementEngine = new AchievementEngine()
```

**Verification:**
- [ ] Achievement Engine funktioniert
- [ ] Can unlock achievements
- [ ] Streak calculation correct

---

#### 4.1.2 Integrate with Workout Completion
**Estimated Time:** 45 min

Update `app/api/workouts/[id]/feedback/route.ts`:

```typescript
import { achievementEngine } from '@/lib/gamification/achievement-engine'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // ... existing code ...

  // Mark workout as completed
  await prisma.workout.update({
    where: { id: params.id },
    data: { completed: true, completedAt: new Date() },
  })

  // Check for new achievements
  const newAchievements = await achievementEngine.checkWorkoutAchievements(user.id)

  return NextResponse.json({
    success: true,
    newAchievements, // Return to show toast
  })
}
```

**Verification:**
- [ ] Achievements unlock after workout completion
- [ ] New achievements returned in response

---

#### 4.1.3 Create Achievement Toast Component
**Estimated Time:** 1 hour

Erstelle `app/components/achievements/achievement-toast.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

interface AchievementToastProps {
  achievement: {
    title: string
    description: string
    icon: string
  }
  onDismiss: () => void
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)

    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Card className="p-6 border-2 border-yellow-400 bg-yellow-50 shadow-2xl max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-4xl shadow-lg">
            {achievement.icon}
          </div>
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
        </div>
      </Card>
    </div>
  )
}
```

**Verification:**
- [ ] Toast appears after unlock
- [ ] Auto-dismisses after 5 seconds
- [ ] Animation smooth

---

#### 4.1.4 Create Achievements Page
**Estimated Time:** 2 hours

Erstelle `app/achievements/page.tsx` (simple version):

```typescript
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AchievementsPage() {
  const user = await requireAuth()

  const achievements = await prisma.achievement.findMany({
    where: { userId: user.id },
    orderBy: { unlockedAt: 'desc' },
  })

  const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Deine Achievements</h1>
        <p className="text-yellow-100">
          {achievements.length} freigeschaltet | {totalPoints} Punkte
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <Card key={achievement.id} className="p-6 border-2 border-yellow-400">
            <div className="text-4xl mb-3">{achievement.icon}</div>
            <h3 className="font-semibold text-lg mb-1">{achievement.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
            <Badge>{achievement.points} Punkte</Badge>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

**Verification:**
- [ ] Page displays all achievements
- [ ] Total points correct

---

## Milestone 4.2: Streak Tracking

### Tasks

#### 4.2.1 Add Streak Display to Dashboard
**Estimated Time:** 1 hour

Update Dashboard header to show streak:

```typescript
// In dashboard header component
const currentStreak = await achievementEngine.calculateStreak(user.id)

// Display:
<div className="flex items-center gap-2">
  <span className="text-3xl">🔥</span>
  <div>
    <p className="text-sm">Streak</p>
    <p className="text-lg font-bold">{currentStreak} Tage</p>
  </div>
</div>
```

**Verification:**
- [ ] Streak shows on dashboard
- [ ] Updates after workout completion

---

## Milestone 4.3: Progress Visualization

### Tasks

#### 4.3.1 Create Goal Progress Component
**Estimated Time:** 1.5 hours

Erstelle `app/components/dashboard/goal-progress.tsx`:

```typescript
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface GoalProgressProps {
  goalDate: Date
  goalName: string
  weeksCompleted: number
  totalWeeks: number
}

export function GoalProgress({
  goalDate,
  goalName,
  weeksCompleted,
  totalWeeks,
}: GoalProgressProps) {
  const now = new Date()
  const daysUntilGoal = Math.floor(
    (goalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  const progressPercent = (weeksCompleted / totalWeeks) * 100

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
      <h3 className="text-lg font-semibold mb-2">Dein Ziel</h3>
      <h2 className="text-2xl font-bold mb-4">{goalName}</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded p-3 text-center">
          <p className="text-3xl font-bold text-purple-600">{daysUntilGoal}</p>
          <p className="text-sm text-gray-600">Tage</p>
        </div>
        <div className="bg-white rounded p-3 text-center">
          <p className="text-3xl font-bold text-purple-600">
            {Math.ceil(daysUntilGoal / 7)}
          </p>
          <p className="text-sm text-gray-600">Wochen</p>
        </div>
      </div>

      <Progress value={progressPercent} className="h-2 mb-2" />
      <p className="text-xs text-gray-600">
        Woche {weeksCompleted} von {totalWeeks}
      </p>
    </Card>
  )
}
```

**Verification:**
- [ ] Progress shows correctly
- [ ] Countdown accurate

---

## Testing

### Integration Tests
**Estimated Time:** 2 hours

Test Scenarios:
1. First workout unlocks achievement
2. 7-day streak unlocks achievement
3. Achievement toast shows
4. Achievements page lists all
5. Streak calculation accurate
6. Progress updates correctly

**Verification:**
- [ ] All scenarios pass
- [ ] No duplicate achievements
- [ ] Performance OK

---

## Success Criteria

Phase 4 ist **erfolgreich abgeschlossen**, wenn:

- ✅ Achievements unlock correctly
- ✅ Toast notifications work
- ✅ Streaks calculated accurately
- ✅ Progress visualization functional
- ✅ Achievements page complete
- ✅ No critical bugs

---

## Next Steps

⬜ **Start Phase 5:** Polish & Production → [phase-5-polish.md](./phase-5-polish.md)

---

**Estimated Total Time:** 30-40 hours
**Critical Path:** Achievement Engine → Integration → UI
**Biggest Risk:** Streak calculation edge cases
**Mitigation:** Comprehensive tests

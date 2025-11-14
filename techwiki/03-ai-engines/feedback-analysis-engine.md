# Feedback Analysis Engine

## Overview

The Feedback Analysis Engine is the "learning brain" of Tri-Train-Buddy. It analyzes user feedback after workouts to:
1. Identify patterns in performance and recovery
2. Learn individual preferences and tolerances
3. Update the athlete's profile with confidence-scored insights
4. Adjust future training plans based on learned preferences

**Core Philosophy:** The app gets smarter with every workout completed.

---

## Architecture

```
Workout Feedback (User Input)
        ↓
   Pattern Detection
   (AI Analysis)
        ↓
   ┌──────────────┬──────────────┬─────────────┐
   │              │              │             │
Recovery      Intensity    Scheduling   Motivation
Patterns      Tolerance    Preferences   Insights
   │              │              │             │
   └──────────────┴──────────────┴─────────────┘
        ↓
   Confidence Scoring
        ↓
   AthletePreference Table
   (Versioned Learning)
        ↓
   Apply to Next Plan Generation
```

---

## 1. Feedback Collection

### Simple Feedback (Required)

```typescript
interface SimpleFeedback {
  workoutId: string
  feeling: 1 | 2 | 3 | 4 | 5  // 😫 😅 😊 😎 🔥
  perceivedDifficulty: number  // 1-10
  notes?: string               // Free text
}
```

### Rich Feedback (Optional Follow-up)

If the user provides concerning feedback (e.g., feeling = 1, difficulty = 9), ask follow-up questions:

```typescript
interface RichFeedback extends SimpleFeedback {
  tooHard?: boolean
  tooEasy?: boolean
  motivationLevel?: 1 | 2 | 3 | 4 | 5
  specificIssues?: {
    timing?: boolean      // "Training time didn't work"
    volume?: boolean      // "Too much volume"
    intensity?: boolean   // "Too hard"
    recovery?: boolean    // "Not enough recovery"
  }
}
```

---

## 2. Pattern Detection

### Implementation

```typescript
// File: app/lib/ai/feedback-analyzer.ts

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Analysis Result Schema
const FeedbackAnalysisSchema = z.object({
  patterns: z.array(z.object({
    type: z.enum(['recovery', 'intensity', 'scheduling', 'motivation', 'nutrition', 'injury_risk']),
    pattern: z.string(),
    confidence: z.number().min(0).max(1),
    dataPoints: z.number(),
    recommendation: z.string(),
  })),
  insights: z.array(z.object({
    category: z.string(),
    finding: z.string(),
    actionable: z.boolean(),
  })),
  educationalMoment: z.string().optional(),
  adjustmentNeeded: z.boolean(),
  adjustmentType: z.enum(['immediate', 'next_cycle', 'none']),
})

type FeedbackAnalysis = z.infer<typeof FeedbackAnalysisSchema>

export async function analyzeFeedback(
  userId: string,
  feedbackId: string
): Promise<FeedbackAnalysis> {

  // 1. Gather context: recent feedback + workout history
  const [currentFeedback, recentFeedback, athleteProfile, preferences] = await Promise.all([
    prisma.workoutFeedback.findUnique({
      where: { id: feedbackId },
      include: {
        workout: {
          include: {
            plan: true,
          },
        },
      },
    }),
    prisma.workoutFeedback.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        workout: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.athleteProfile.findUnique({
      where: { userId },
    }),
    prisma.athletePreference.findMany({
      where: { userId, active: true },
    }),
  ])

  if (!currentFeedback || !athleteProfile) {
    throw new Error('Missing required data')
  }

  // 2. Build analysis prompt
  const systemPrompt = `You are an expert endurance sports coach analyzing workout feedback.

Your task:
1. Identify patterns in the athlete's feedback over time
2. Compare current feedback to their history
3. Detect early warning signs (overtraining, injury risk, motivation issues)
4. Generate actionable recommendations

**Athlete Profile:**
- Goal: ${athleteProfile.goal}
- Current Level: ${JSON.stringify(athleteProfile.currentLevel)}
- Injury History: ${athleteProfile.injuryHistory.join(', ') || 'None'}
- Risk Profile: ${athleteProfile.riskProfile}
- Learned Preferences: ${JSON.stringify(athleteProfile.learnedPreferences)}

**Current Workout:**
- Type: ${currentFeedback.workout.type}
- Discipline: ${currentFeedback.workout.discipline}
- Duration: ${currentFeedback.workout.durationMin} min
- Intensity: ${currentFeedback.workout.intensityZone}

**Current Feedback:**
- Feeling: ${currentFeedback.feeling}/5
- Difficulty: ${currentFeedback.perceivedDifficulty}/10
- Notes: ${currentFeedback.notes || 'None'}

**Recent Feedback History (last 20 workouts):**
${recentFeedback.map((fb) => `
- ${fb.workout.date.toISOString().split('T')[0]} | ${fb.workout.type} | Feeling: ${fb.feeling}/5 | Difficulty: ${fb.perceivedDifficulty}/10
  Notes: ${fb.notes || 'None'}
`).join('\n')}

**Existing Preferences:**
${preferences.map((p) => `- ${p.category}: ${p.key} (confidence: ${p.confidence})`).join('\n')}

---

## Pattern Detection Guidelines

### Recovery Patterns
- If multiple hard workouts are rated "too hard" (feeling ≤ 2), increase recovery time
- If long runs consistently followed by bad next-day workout → increase post-long-run recovery
- Pattern: "needs 48-72h after long run"

### Intensity Tolerance
- If all Z4-Z5 workouts rated 8-10 difficulty → athlete struggles with intensity
- If easy runs consistently rated "too easy" → can handle more volume
- Pattern: "max 2 hard days per week"

### Scheduling Preferences
- If morning workouts consistently rated low motivation → prefer evenings
- If weekend long runs always rated highly → Saturday is optimal long run day
- Pattern: "prefers long runs on Saturday"

### Injury Risk Flags
- Sudden drop in feeling across multiple workouts → possible overreaching
- Specific body part mentioned multiple times → early injury warning
- Pattern: "right knee sensitivity after intervals"

### Motivation Insights
- If notes mention "no time" frequently → scheduling constraints
- If "boring" appears → needs more variety
- Pattern: "motivated by group workouts"

---

## Output Format

Return:
1. **Patterns**: Array of detected patterns with confidence scores
2. **Insights**: Key findings from this feedback
3. **Educational Moment**: Teaching opportunity (optional)
4. **Adjustment Needed**: Whether to modify current or future plans

Confidence scoring:
- 0.9-1.0: Strong pattern (5+ consistent data points)
- 0.7-0.89: Moderate pattern (3-4 data points)
- 0.5-0.69: Emerging pattern (2 data points)
- <0.5: Insufficient data

Only report patterns with confidence ≥ 0.7`

  // 3. Call AI for analysis
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    temperature: 0.3,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }, // Cache system prompt
      },
    ],
    messages: [
      {
        role: 'user',
        content: 'Analyze this feedback and identify patterns.',
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No response from AI')
  }

  const parsed = JSON.parse(textContent.text)
  return FeedbackAnalysisSchema.parse(parsed)
}
```

---

## 3. Learning Pipeline

### Save Learned Preferences

```typescript
// File: app/lib/ai/preference-learner.ts

export async function learnFromFeedback(
  userId: string,
  analysis: FeedbackAnalysis
): Promise<void> {

  for (const pattern of analysis.patterns) {
    // Only save patterns with confidence ≥ 0.7
    if (pattern.confidence < 0.7) continue

    const preferenceKey = generatePreferenceKey(pattern)

    // Check if preference already exists
    const existing = await prisma.athletePreference.findUnique({
      where: {
        userId_key: {
          userId,
          key: preferenceKey,
        },
      },
    })

    if (existing) {
      // Update existing preference
      await prisma.athletePreference.update({
        where: { id: existing.id },
        data: {
          value: pattern, // Store full pattern object
          confidence: pattern.confidence,
          dataPoints: pattern.dataPoints,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new preference
      await prisma.athletePreference.create({
        data: {
          userId,
          category: pattern.type,
          key: preferenceKey,
          value: pattern,
          learnedFrom: 'feedback-analysis',
          confidence: pattern.confidence,
          dataPoints: pattern.dataPoints,
        },
      })
    }
  }

  // Update athlete profile's learnedPreferences JSON
  await updateLearnedPreferences(userId, analysis.patterns)
}

function generatePreferenceKey(pattern: any): string {
  // Generate unique key from pattern
  const typeMap = {
    recovery: 'recovery-',
    intensity: 'intensity-',
    scheduling: 'schedule-',
    motivation: 'motivation-',
    nutrition: 'nutrition-',
    injury_risk: 'injury-',
  }

  const prefix = typeMap[pattern.type as keyof typeof typeMap] || 'other-'
  const slug = pattern.pattern.toLowerCase().replace(/\s+/g, '-').slice(0, 30)

  return `${prefix}${slug}`
}

async function updateLearnedPreferences(
  userId: string,
  patterns: any[]
): Promise<void> {

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId },
    select: { learnedPreferences: true },
  })

  if (!profile) return

  const currentPreferences = profile.learnedPreferences as Record<string, any>

  // Merge new patterns
  for (const pattern of patterns) {
    const key = generatePreferenceKey(pattern)
    currentPreferences[key] = {
      pattern: pattern.pattern,
      confidence: pattern.confidence,
      dataPoints: pattern.dataPoints,
      learnedAt: new Date().toISOString(),
    }
  }

  await prisma.athleteProfile.update({
    where: { userId },
    data: {
      learnedPreferences: currentPreferences,
    },
  })
}
```

---

## 4. Applying Learned Preferences

### Integration with Plan Generation

```typescript
// File: app/lib/ai/plan-generator.ts (updated)

async function applyLearnedPreferences(
  plan: GeneratedPlan,
  preferences: AthletePreference[]
): Promise<GeneratedPlan> {

  for (const pref of preferences) {
    const { category, value } = pref

    switch (category) {
      case 'RECOVERY':
        plan = adjustRecovery(plan, value)
        break

      case 'INTENSITY':
        plan = adjustIntensity(plan, value)
        break

      case 'SCHEDULING':
        plan = adjustScheduling(plan, value)
        break

      case 'MOTIVATION':
        plan = addMotivationalElements(plan, value)
        break

      case 'INJURY_RISK':
        plan = mitigateInjuryRisk(plan, value)
        break
    }
  }

  return plan
}

function adjustRecovery(plan: GeneratedPlan, preference: any): GeneratedPlan {
  // Example: "needs 48-72h after long run"
  if (preference.pattern.includes('after long run')) {
    const minRecoveryHours = preference.value.minHours || 48

    // Find long runs
    const longRunIndices = plan.workouts.findIndex(
      (w) => w.type === 'LONG' && w.discipline === 'RUN'
    )

    // Ensure next day is easy or rest
    if (longRunIndices.length > 0) {
      longRunIndices.forEach((idx) => {
        if (idx + 1 < plan.workouts.length) {
          const nextWorkout = plan.workouts[idx + 1]
          if (nextWorkout.type !== 'EASY' && nextWorkout.type !== 'REST') {
            // Swap with an easy day
            plan.workouts[idx + 1] = {
              ...nextWorkout,
              type: 'EASY',
              intensityZone: 'Z1',
              explanation: 'Easy day for recovery after long run (learned from your feedback)',
            }
          }
        }
      })
    }
  }

  return plan
}

function adjustIntensity(plan: GeneratedPlan, preference: any): GeneratedPlan {
  // Example: "max 2 hard days per week"
  if (preference.pattern.includes('max') && preference.pattern.includes('hard days')) {
    const maxHardDays = preference.value.maxPerWeek || 2

    // Count hard days per week
    const week1HardDays = plan.week1.filter(
      (w) => w.type === 'THRESHOLD' || w.type === 'INTERVALS' || w.type === 'VO2MAX'
    ).length

    if (week1HardDays > maxHardDays) {
      // Reduce intensity of some workouts
      let reduced = 0
      for (let i = 0; i < plan.week1.length && reduced < week1HardDays - maxHardDays; i++) {
        if (plan.week1[i].type === 'THRESHOLD') {
          plan.week1[i] = {
            ...plan.week1[i],
            type: 'TEMPO',
            intensityZone: 'Z3',
            explanation: 'Reduced intensity based on your tolerance (learned preference)',
          }
          reduced++
        }
      }
    }
  }

  return plan
}

function adjustScheduling(plan: GeneratedPlan, preference: any): GeneratedPlan {
  // Example: "prefers long runs on Saturday"
  if (preference.pattern.includes('long run') && preference.value.preferredDay) {
    const preferredDay = preference.value.preferredDay // "Saturday"

    // Find long run and move to preferred day
    const longRunIdx = plan.workouts.findIndex(
      (w) => w.type === 'LONG' && w.discipline === 'RUN'
    )

    if (longRunIdx >= 0) {
      const longRun = plan.workouts[longRunIdx]
      const saturdayIdx = 5 // Assuming week starts Monday

      // Swap workouts
      const temp = plan.workouts[saturdayIdx]
      plan.workouts[saturdayIdx] = longRun
      plan.workouts[longRunIdx] = temp
    }
  }

  return plan
}
```

---

## 5. Educational Moments

### Generate Contextual Education

```typescript
function generateEducationalMoment(
  feedback: WorkoutFeedback,
  analysis: FeedbackAnalysis
): string | null {

  // If athlete reports difficulty but pushed through
  if (feedback.feeling <= 2 && feedback.perceivedDifficulty >= 8) {
    return `**Gut gemacht, dass du durchgehalten hast!** 💪

Aber: Ein wichtiges Prinzip im Training ist, dass schwere Tage *schwer* sein sollen, und leichte Tage *leicht*.

Wenn ein Training so hart ist, dass du dich danach komplett erschöpft fühlst, riskierst du:
- Längere Erholung nötig
- Erhöhtes Verletzungsrisiko
- Weniger Qualität im nächsten harten Training

**Was tun?**
Wenn ein Training zu hart wird, ist es besser abzubrechen oder zu reduzieren. Das ist kein Versagen – das ist intelligentes Training.

Ich passe den nächsten Plan an, damit die Intensität besser zu deinem aktuellen Level passt.`
  }

  // If athlete skipped recovery day
  if (feedback.workout.type === 'EASY' && feedback.notes?.includes('skipped')) {
    return `**Recovery ist Training!** 🔄

Ich sehe, dass du den Easy Day übersprungen hast. Das ist verständlich – gerade wenn man motiviert ist, fühlen sich Ruhetage wie "verschwendete Zeit" an.

Aber: **Dein Körper wird nicht beim Training stärker, sondern in der Erholung.**

Was während eines Easy Days passiert:
- Muskelreparatur und -aufbau
- Glykogenspeicher auffüllen
- Zentrales Nervensystem erholt sich
- Anpassungen aus hartem Training werden manifestiert

Ohne Recovery → keine Verbesserung. Versprochen! 😊`
  }

  return null
}
```

---

## 6. Warning Signs Detection

### Overtraining Syndrome Detection

```typescript
interface OvertrainingWarning {
  severity: 'low' | 'medium' | 'high'
  indicators: string[]
  recommendation: string
  actionRequired: boolean
}

function detectOvertrainingWarnings(
  recentFeedback: WorkoutFeedback[]
): OvertrainingWarning | null {

  const last7Days = recentFeedback.slice(0, 7)

  const indicators: string[] = []
  let severity: 'low' | 'medium' | 'high' = 'low'

  // 1. Consecutive low feelings
  const consecutiveLowFeelings = last7Days.filter((fb) => fb.feeling <= 2).length
  if (consecutiveLowFeelings >= 3) {
    indicators.push(`${consecutiveLowFeelings} workouts in a row mit low feeling`)
    severity = 'medium'
  }

  // 2. High perceived difficulty on easy workouts
  const hardEasyWorkouts = last7Days.filter(
    (fb) => fb.workout.type === 'EASY' && fb.perceivedDifficulty >= 7
  ).length
  if (hardEasyWorkouts >= 2) {
    indicators.push('Easy workouts fühlen sich zu schwer an')
    severity = severity === 'medium' ? 'high' : 'medium'
  }

  // 3. Motivation drop
  const avgMotivation = last7Days
    .filter((fb) => fb.motivationLevel)
    .reduce((sum, fb) => sum + (fb.motivationLevel || 0), 0) / last7Days.length

  if (avgMotivation < 2.5) {
    indicators.push('Niedrige Motivation')
  }

  // 4. Notes mentioning fatigue
  const fatigueKeywords = ['müde', 'erschöpft', 'keine energie', 'kaputt']
  const fatigueCount = last7Days.filter((fb) =>
    fatigueKeywords.some((kw) => fb.notes?.toLowerCase().includes(kw))
  ).length

  if (fatigueCount >= 3) {
    indicators.push('Häufige Erwähnung von Erschöpfung')
    severity = 'high'
  }

  if (indicators.length === 0) return null

  const recommendation = severity === 'high'
    ? '🚨 **Warnung**: Anzeichen von Overreaching. Empfehle 3-5 Tage komplette Ruhe oder nur sehr leichtes Training.'
    : severity === 'medium'
    ? '⚠️ **Achtung**: Mögliche Überlastung. Empfehle reduziertes Volumen diese Woche.'
    : 'ℹ️ **Hinweis**: Achte auf zusätzliche Erholung.'

  return {
    severity,
    indicators,
    recommendation,
    actionRequired: severity === 'high',
  }
}
```

---

## 7. API Integration

### Feedback Submission with Analysis

```typescript
// File: app/api/workouts/[id]/feedback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { analyzeFeedback, learnFromFeedback } from '@/lib/ai/feedback-analyzer'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { feeling, perceivedDifficulty, notes, ...richFeedback } = await req.json()

  // 1. Save feedback
  const feedback = await prisma.workoutFeedback.create({
    data: {
      workoutId: params.id,
      userId: session.user.id,
      feeling,
      perceivedDifficulty,
      notes,
      ...richFeedback,
    },
  })

  // 2. Mark workout as completed
  await prisma.workout.update({
    where: { id: params.id },
    data: {
      completed: true,
      completedAt: new Date(),
    },
  })

  // 3. Analyze feedback (async - don't block response)
  analyzeFeedback(session.user.id, feedback.id)
    .then((analysis) => {
      // Save analysis to feedback
      return prisma.workoutFeedback.update({
        where: { id: feedback.id },
        data: {
          aiAnalysis: analysis,
          analyzed: true,
          analyzedAt: new Date(),
        },
      })
    })
    .then((updatedFeedback) => {
      // Learn from patterns
      if (updatedFeedback.aiAnalysis) {
        return learnFromFeedback(session.user.id, updatedFeedback.aiAnalysis as any)
      }
    })
    .catch((error) => {
      console.error('Feedback analysis failed:', error)
      // Don't fail the request - analysis can be retried
    })

  return NextResponse.json({
    success: true,
    message: 'Feedback gespeichert! Danke 🙏',
  })
}
```

### Get Insights Dashboard

```typescript
// File: app/api/insights/route.ts

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get learned preferences
  const preferences = await prisma.athletePreference.findMany({
    where: {
      userId: session.user.id,
      active: true,
      confidence: { gte: 0.7 },
    },
    orderBy: { confidence: 'desc' },
  })

  // Get recent feedback with analysis
  const recentFeedback = await prisma.workoutFeedback.findMany({
    where: {
      userId: session.user.id,
      analyzed: true,
    },
    include: {
      workout: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Detect warnings
  const allFeedback = await prisma.workoutFeedback.findMany({
    where: { userId: session.user.id },
    include: { workout: true },
    orderBy: { createdAt: 'desc' },
    take: 14,
  })

  const warnings = detectOvertrainingWarnings(allFeedback)

  return NextResponse.json({
    preferences,
    recentInsights: recentFeedback.map((fb) => fb.aiAnalysis),
    warnings,
  })
}
```

---

## 8. Frontend Visualization

### Insights Display

```typescript
// File: app/components/dashboard/insights-panel.tsx

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Insight {
  category: string
  finding: string
  confidence: number
}

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Was ich über dich gelernt habe 🧠</h3>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{insight.finding}</p>
              <p className="text-xs text-gray-500 mt-1">
                Confidence: {Math.round(insight.confidence * 100)}%
              </p>
            </div>
            <Badge variant="secondary">{insight.category}</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

---

**Next:** Educational Content Engine

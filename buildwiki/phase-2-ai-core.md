# Phase 2: AI Core

## Ziel
Funktionierende AI-Engines für Plan-Generierung, Natural Language Parsing, und Feedback-Analyse.

**Duration:** 1-2 Wochen
**Effort:** ~50-70 Stunden
**Risk Level:** 🟡 Medium (AI-Performance, Kosten)

---

## Voraussetzungen

- ✅ Phase 1 erfolgreich abgeschlossen
- ✅ Anthropic API Key funkti oniert
- ✅ Trainwiki Files vorhanden (`trainwiki/`)
- ✅ Database Schema deployed

---

## Phase Milestones

### Milestone 2.1: Plan Generation Engine (Tag 1-4)
**Ziel:** AI generiert validierte 2-Wochen-Trainingspläne

### Milestone 2.2: Constraint Parser (Tag 5-6)
**Ziel:** Natural Language → Structured Constraints

### Milestone 2.3: Feedback Collection (Tag 7-8)
**Ziel:** User kann Feedback geben, wird gespeichert

### Milestone 2.4: AI Insights (Tag 9-10)
**Ziel:** Daily Insights auf Dashboard

### Milestone 2.5: Testing & Optimization (Tag 11-12)
**Ziel:** AI Kosten optimiert, alle Tests grün

---

## Milestone 2.1: Plan Generation Engine

**Reference:** `techwiki/03-ai-engines/plan-generation-engine.md`

### Tasks

#### 2.1.1 Create AI Utilities
**Estimated Time:** 30 min

Erstelle `app/lib/ai/client.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Model selection helper
export function selectModel(complexity: 'simple' | 'complex'): string {
  return complexity === 'simple'
    ? 'claude-haiku-4-20250514'
    : 'claude-sonnet-4-20250514'
}

// Cost tracking
export async function trackAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<number> {
  const costs = {
    'claude-haiku-4-20250514': { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 },
    'claude-sonnet-4-20250514': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  }

  const modelCosts = costs[model as keyof typeof costs]
  const cost = (inputTokens * modelCosts.input) + (outputTokens * modelCosts.output)

  // Log to database (future: AICostLog table)
  console.log(`AI Cost: $${cost.toFixed(4)} - ${model}`)

  return cost
}
```

**Verification:**
- [ ] Kann Anthropic Client importieren
- [ ] selectModel funktioniert

---

#### 2.1.2 Create Workout Schema
**Estimated Time:** 45 min

Erstelle `app/lib/ai/schemas.ts`:

```typescript
import { z } from 'zod'

export const WorkoutSchema = z.object({
  date: z.string(), // ISO date
  discipline: z.enum(['RUN', 'BIKE', 'SWIM', 'STRENGTH', 'REST']),
  type: z.enum([
    'EASY',
    'LONG',
    'TEMPO',
    'THRESHOLD',
    'INTERVALS',
    'VO2MAX',
    'RECOVERY',
    'REST',
  ]),
  title: z.string(),
  description: z.string(),
  durationMin: z.number().int().min(0),
  intensityZone: z.enum(['Z1', 'Z2', 'Z3', 'Z4', 'Z5']).nullable(),
  explanation: z.string(),
  executionTips: z.string().optional(),
  isFirstOfType: z.boolean().default(false),
})

export const TrainingPlanSchema = z.object({
  week1: z.array(WorkoutSchema).length(7),
  week2: z.array(WorkoutSchema).length(7),
  rationale: z.string(),
  phase: z.enum(['BASE', 'BUILD', 'PEAK', 'TAPER']),
  weeklyVolume: z.object({
    week1: z.number(),
    week2: z.number(),
  }),
  keyWorkouts: z.array(z.string()),
})

export type Workout = z.infer<typeof WorkoutSchema>
export type TrainingPlan = z.infer<typeof TrainingPlanSchema>
```

**Verification:**
- [ ] Schemas kompilieren
- [ ] Kann Workout validieren

---

#### 2.1.3 Load Trainwiki Helper
**Estimated Time:** 30 min

Erstelle `app/lib/ai/trainwiki-loader.ts`:

```typescript
import { promises as fs } from 'fs'
import path from 'path'

export async function loadTrainwikiDocs(files: string[]): Promise<string> {
  const trainwikiPath = path.join(process.cwd(), 'trainwiki')

  const contents = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(trainwikiPath, file)
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        return `## ${file}\n\n${content}`
      } catch (error) {
        console.warn(`Failed to load ${file}:`, error)
        return ''
      }
    })
  )

  return contents.filter(Boolean).join('\n\n---\n\n')
}

export function selectRelevantDocs(
  goalType: string,
  phase: string
): string[] {
  const docs = [
    'core/periodization.md',
    'core/80-20-rule.md',
    'core/recovery.md',
    'core/load-management.md',
  ]

  // Add sport-specific
  if (goalType.includes('MARATHON') || goalType.includes('RUN')) {
    docs.push('sports/running.md')
    docs.push('combinations/running-focused.md')
  }

  if (goalType.includes('IRONMAN') || goalType.includes('TRI')) {
    docs.push('sports/running.md')
    docs.push('sports/cycling.md')
    docs.push('sports/swimming.md')
    docs.push('combinations/triathlon.md')
  }

  return docs
}
```

**Verification:**
- [ ] Kann Trainwiki Files laden
- [ ] selectRelevantDocs gibt korrekte Files

---

#### 2.1.4 Implement Plan Generator
**Estimated Time:** 3 hours

Erstelle `app/lib/ai/plan-generator.ts`:

```typescript
import { anthropic, selectModel } from './client'
import { TrainingPlanSchema, type TrainingPlan } from './schemas'
import { loadTrainwikiDocs, selectRelevantDocs } from './trainwiki-loader'
import { prisma } from '@/lib/prisma'

interface PlanContext {
  userId: string
  profile: any
  preferences: any[]
  constraints: any[]
}

export async function generateTrainingPlan(userId: string): Promise<TrainingPlan> {
  // 1. Gather context
  const context = await gatherPlanContext(userId)

  // 2. Determine phase
  const phase = determinePhase(context.profile.goalDate)

  // 3. Load relevant training knowledge
  const trainwikiDocs = await loadTrainwikiDocs(
    selectRelevantDocs(context.profile.goalType, phase.phase)
  )

  // 4. Build prompt
  const prompt = buildPlanGenerationPrompt(context, phase, trainwikiDocs)

  // 5. Call AI
  const plan = await callClaudeForPlan(prompt, context)

  // 6. Validate
  const validated = validatePlan(plan, context)

  // 7. Save to database
  await savePlanToDatabase(userId, validated, phase)

  return validated
}

async function gatherPlanContext(userId: string): Promise<PlanContext> {
  const [profile, preferences, constraints] = await Promise.all([
    prisma.athleteProfile.findUnique({ where: { userId } }),
    prisma.athletePreference.findMany({
      where: { userId, active: true, confidence: { gte: 0.7 } },
    }),
    // TODO: Load active constraints
    Promise.resolve([]),
  ])

  if (!profile) throw new Error('No athlete profile found')

  return { userId, profile, preferences, constraints }
}

function determinePhase(goalDate: Date): {
  phase: 'BASE' | 'BUILD' | 'PEAK' | 'TAPER'
  weeksToGoal: number
} {
  const now = new Date()
  const weeksToGoal = Math.ceil(
    (goalDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  if (weeksToGoal > 16) return { phase: 'BASE', weeksToGoal }
  if (weeksToGoal > 8) return { phase: 'BUILD', weeksToGoal }
  if (weeksToGoal > 4) return { phase: 'PEAK', weeksToGoal }
  return { phase: 'TAPER', weeksToGoal }
}

function buildPlanGenerationPrompt(
  context: PlanContext,
  phase: any,
  trainwikiDocs: string
): string {
  return `You are an expert endurance sports coach creating a 2-week training plan.

**Athlete Profile:**
- Goal: ${context.profile.goal}
- Goal Type: ${context.profile.goalType}
- Goal Date: ${context.profile.goalDate}
- Weeks to Goal: ${phase.weeksToGoal}
- Current Level: ${JSON.stringify(context.profile.currentLevel)}
- Availability: ${JSON.stringify(context.profile.availability)}
- Injury History: ${context.profile.injuryHistory.join(', ') || 'None'}
- Risk Profile: ${context.profile.riskProfile}

**Current Phase: ${phase.phase}**

**Learned Preferences:**
${context.preferences.map((p) => `- ${p.category}: ${p.key} (confidence: ${p.confidence})`).join('\n')}

**Active Constraints:**
${context.constraints.length > 0 ? JSON.stringify(context.constraints) : 'None'}

**Training Science Knowledge:**
${trainwikiDocs}

---

## Your Task

Create a 2-week training plan (14 days) following these principles:

### Phase-Specific Focus
${getPhaseGuidelines(phase.phase)}

### Core Principles
1. **80/20 Rule**: 80% easy (Z1-Z2), 20% hard (Z4-Z5)
2. **Progressive Overload**: Never increase weekly volume > 10%
3. **Recovery**: At least 1 rest day per week, easy day after hard workout
4. **No Back-to-Back Hard Days**: Space threshold/intervals by 48h minimum
5. **Respect Constraints**: Honor availability and injury history

### Workout Distribution (per week)
- 1 Long workout (endurance)
- 1-2 Hard workouts (threshold/intervals)
- 3-4 Easy workouts (Z1-Z2)
- 1 Rest day
- Optional: Strength 1-2x/week

### Output Format

Return JSON matching this schema:
{
  "week1": [
    {
      "date": "2024-11-18", // Monday of week 1
      "discipline": "RUN",
      "type": "EASY",
      "title": "Easy Run",
      "description": "40 minutes easy pace in Zone 2. Focus on form.",
      "durationMin": 40,
      "intensityZone": "Z2",
      "explanation": "This easy run builds aerobic base without stress.",
      "executionTips": "Keep it conversational - you should be able to talk.",
      "isFirstOfType": false
    },
    // ... 6 more days (Tue-Sun)
  ],
  "week2": [
    // ... 7 days
  ],
  "rationale": "This plan focuses on building aerobic base while...",
  "phase": "${phase.phase}",
  "weeklyVolume": {
    "week1": 320,  // Total minutes
    "week2": 340
  },
  "keyWorkouts": ["Long Run Sunday Week 1", "Threshold Thursday Week 2"]
}

**IMPORTANT:**
- Every workout needs "explanation" (why are we doing this?)
- Mark first occurrence of workout type as "isFirstOfType": true
- Ensure progression from week 1 to week 2
- Respect athlete's availability preferences
- Be conservative if injury history present

Return ONLY the JSON, no markdown formatting.`
}

function getPhaseGuidelines(phase: string): string {
  const guidelines = {
    BASE: `- Focus: Aerobic base building, injury prevention
- Volume: Moderate, sustainable
- Intensity: Mostly Z1-Z2 (80%+), minimal Z4-Z5
- Long Workouts: Build duration gradually
- Strength: 2x/week`,
    BUILD: `- Focus: Adding intensity, sport-specific fitness
- Volume: Peak volume (but respect 10% rule)
- Intensity: 70-75% easy, 25-30% hard
- Long Workouts: Near race-distance
- Threshold: 1x/week, Intervals: 0-1x/week`,
    PEAK: `- Focus: Race-specific work, maintaining fitness
- Volume: Slight reduction from BUILD
- Intensity: High quality, race-pace efforts
- Long Workouts: Include race-pace segments
- Taper: None yet (next phase)`,
    TAPER: `- Focus: Recovery, freshness, sharpness
- Volume: 40-60% reduction
- Intensity: Short, sharp efforts to maintain fitness
- Long Workouts: Significantly reduced
- Rest: Prioritize sleep and recovery`,
  }

  return guidelines[phase as keyof typeof guidelines] || guidelines.BASE
}

async function callClaudeForPlan(
  prompt: string,
  context: PlanContext
): Promise<TrainingPlan> {
  const response = await anthropic.messages.create({
    model: selectModel('complex'),
    max_tokens: 4096,
    temperature: 0.3,
    system: [
      {
        type: 'text',
        text: 'You are an expert endurance sports coach with deep knowledge of training science, periodization, and individualized programming.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI')
  }

  const parsed = JSON.parse(textContent.text)
  return TrainingPlanSchema.parse(parsed)
}

function validatePlan(plan: TrainingPlan, context: PlanContext): TrainingPlan {
  // 1. Check 80/20 distribution
  const allWorkouts = [...plan.week1, ...plan.week2]
  const easyWorkouts = allWorkouts.filter((w) =>
    ['Z1', 'Z2'].includes(w.intensityZone || '')
  ).length
  const hardWorkouts = allWorkouts.filter((w) =>
    ['Z4', 'Z5'].includes(w.intensityZone || '')
  ).length

  const easyPercent = (easyWorkouts / allWorkouts.length) * 100

  if (easyPercent < 70) {
    console.warn(`⚠️  80/20 rule violated: Only ${easyPercent}% easy workouts`)
  }

  // 2. Check weekly volume progression
  const volumeIncrease =
    ((plan.weeklyVolume.week2 - plan.weeklyVolume.week1) / plan.weeklyVolume.week1) * 100

  if (volumeIncrease > 10) {
    console.warn(`⚠️  Volume increase too high: ${volumeIncrease}%`)
  }

  // 3. Check no back-to-back hard days
  for (let i = 0; i < plan.week1.length - 1; i++) {
    const today = plan.week1[i]
    const tomorrow = plan.week1[i + 1]

    if (
      ['THRESHOLD', 'INTERVALS', 'VO2MAX'].includes(today.type) &&
      ['THRESHOLD', 'INTERVALS', 'VO2MAX'].includes(tomorrow.type)
    ) {
      console.warn(`⚠️  Back-to-back hard days: ${today.date} and ${tomorrow.date}`)
    }
  }

  // 4. Check rest days
  const week1RestDays = plan.week1.filter((w) => w.type === 'REST').length
  const week2RestDays = plan.week2.filter((w) => w.type === 'REST').length

  if (week1RestDays === 0 || week2RestDays === 0) {
    console.warn('⚠️  No rest days in plan')
  }

  return plan
}

async function savePlanToDatabase(
  userId: string,
  plan: TrainingPlan,
  phase: any
): Promise<void> {
  // Create training plan
  const savedPlan = await prisma.trainingPlan.create({
    data: {
      userId,
      startDate: new Date(plan.week1[0].date),
      endDate: new Date(plan.week2[6].date),
      phase: plan.phase,
      generatedBy: 'claude-sonnet-4',
      constraints: [],
      rationale: plan.rationale,
      status: 'ACTIVE',
    },
  })

  // Create workouts
  const workouts = [...plan.week1, ...plan.week2].map((workout) => ({
    planId: savedPlan.id,
    userId,
    date: new Date(workout.date),
    discipline: workout.discipline,
    type: workout.type,
    title: workout.title,
    description: workout.description,
    durationMin: workout.durationMin,
    intensityZone: workout.intensityZone,
    explanation: workout.explanation,
    executionTips: workout.executionTips,
    isFirstOfType: workout.isFirstOfType,
  }))

  await prisma.workout.createMany({
    data: workouts,
  })

  console.log(`✅ Plan created: ${savedPlan.id} with ${workouts.length} workouts`)
}
```

**Verification:**
- [ ] Code kompiliert ohne Errors
- [ ] Kann generateTrainingPlan aufrufen (Test mit User ID)

---

#### 2.1.5 Create Server Action
**Estimated Time:** 30 min

Erstelle `app/actions/plans.ts`:

```typescript
'use server'

import { requireAuth } from '@/lib/auth-helpers'
import { generateTrainingPlan } from '@/lib/ai/plan-generator'
import { revalidatePath } from 'next/cache'

export async function createNewPlan() {
  const user = await requireAuth()

  try {
    const plan = await generateTrainingPlan(user.id)

    revalidatePath('/dashboard')

    return { success: true, message: 'Plan erstellt!' }
  } catch (error) {
    console.error('Error creating plan:', error)
    return { success: false, error: 'Plan creation failed' }
  }
}
```

**Verification:**
- [ ] Server Action funktioniert
- [ ] Kann von Client aufgerufen werden

---

#### 2.1.6 Test Plan Generation
**Estimated Time:** 2 hours

**Manual Testing:**

1. Erstelle Test-User mit vollständigem AthleteProfile:
```sql
-- In Prisma Studio oder via SQL
INSERT INTO "AthleteProfile" (
  id, userId, goal, goalType, goalDate,
  currentLevel, availability, riskProfile,
  onboardingCompleted
) VALUES (
  'test-profile-1',
  'your-user-id',
  'Hamburg Marathon 2026',
  'MARATHON',
  '2026-04-26',
  '{"experience": "intermediate", "weeklyVolume": 30}',
  '{"mornings": ["Mon", "Wed", "Fri"]}',
  'MODERATE',
  true
);
```

2. Rufe `generateTrainingPlan(userId)` auf

3. Verifications:
- [ ] Plan wird generiert (< 15 Sekunden)
- [ ] Plan validiert erfolgreich
- [ ] 14 Workouts in Database
- [ ] Rationale macht Sinn
- [ ] 80/20 Rule eingehalten
- [ ] Keine back-to-back hard days
- [ ] Kosten < $1.00 pro Plan

**Bug Tracking:**
Dokumentiere Probleme in `bugs-phase2.md`

---

## Milestone 2.2: Constraint Parser

**Reference:** `techwiki/03-ai-engines/conversational-interface-engine.md`

### Tasks

#### 2.2.1 Implement Constraint Parser
**Estimated Time:** 2 hours

Erstelle `app/lib/ai/constraint-parser.ts`:

```typescript
import { anthropic, selectModel } from './client'
import { z } from 'zod'

const ConstraintSchema = z.object({
  userInput: z.string(),
  parsed: z.object({
    dateRanges: z.array(
      z.object({
        start: z.string(),
        end: z.string(),
        type: z.enum(['travel', 'event', 'injury', 'vacation', 'work', 'other']),
        equipment: z.array(z.string()).optional(),
        location: z.string().optional(),
        impact: z.enum(['block', 'modify', 'note']),
        description: z.string(),
      })
    ),
  }),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  clarifyingQuestions: z.array(z.string()).optional(),
})

export async function parseConstraint(userInput: string) {
  const systemPrompt = `You are an expert at parsing natural language constraints for training schedules.

Extract structured information from user input about constraints, travel, events, or limitations.

Today's date: ${new Date().toISOString().split('T')[0]}

Return JSON matching the schema.`

  const response = await anthropic.messages.create({
    model: selectModel('simple'), // Use Haiku for cost
    max_tokens: 512,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userInput }],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No response from AI')
  }

  const parsed = JSON.parse(textContent.text)
  return ConstraintSchema.parse(parsed)
}
```

**Verification:**
- [ ] parseConstraint funktioniert
- [ ] Test Inputs:
  - "Nächste Woche Dienstreise München"
  - "Knie tut weh, lieber kein Laufen diese Woche"
  - "Urlaub vom 1.-15. Dezember, kein Training möglich"

---

## Milestone 2.3: Feedback Collection

### Tasks

#### 2.3.1 Create Feedback UI
**Estimated Time:** 1.5 hours

Erstelle `app/workouts/[id]/feedback/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function WorkoutFeedbackPage({
  params,
}: {
  params: { id: string }
}) {
  const [feeling, setFeeling] = useState<number>(3)
  const [difficulty, setDifficulty] = useState<number>(5)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    setLoading(true)

    try {
      const response = await fetch(`/api/workouts/${params.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeling,
          perceivedDifficulty: difficulty,
          notes,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      router.push('/dashboard')
    } catch (error) {
      alert('Feedback submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-8">
        <h1 className="text-2xl font-bold mb-6">Workout Feedback</h1>

        {/* Feeling Scale */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Wie hast du dich gefühlt?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setFeeling(value)}
                className={`w-12 h-12 rounded-full text-2xl ${
                  feeling === value ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                {['😫', '😅', '😊', '😎', '🔥'][value - 1]}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Scale */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Wie schwer war es? (1 = sehr leicht, 10 = extrem schwer)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-center text-lg font-semibold">{difficulty}/10</div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Notizen (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Wie lief das Training? Gab es Probleme?"
            rows={4}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? 'Wird gespeichert...' : 'Feedback speichern'}
        </Button>
      </Card>
    </div>
  )
}
```

**Verification:**
- [ ] Feedback Page lädt
- [ ] Kann Feeling auswählen
- [ ] Difficulty Slider funktioniert

---

#### 2.3.2 Create Feedback API
**Estimated Time:** 45 min

Erstelle `app/api/workouts/[id]/feedback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const FeedbackSchema = z.object({
  feeling: z.number().int().min(1).max(5),
  perceivedDifficulty: z.number().int().min(1).max(10),
  notes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  const body = await req.json()
  const validation = FeedbackSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input' },
      { status: 400 }
    )
  }

  // Verify workout belongs to user
  const workout = await prisma.workout.findUnique({
    where: { id: params.id },
  })

  if (!workout || workout.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Create feedback
  await prisma.workoutFeedback.create({
    data: {
      workoutId: params.id,
      userId: user.id,
      ...validation.data,
    },
  })

  // Mark workout as completed
  await prisma.workout.update({
    where: { id: params.id },
    data: {
      completed: true,
      completedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
```

**Verification:**
- [ ] API speichert Feedback
- [ ] Workout marked as completed
- [ ] Feedback in Database sichtbar

---

## Milestone 2.4: AI Insights

**Reference:** `techwiki/04-features/dashboard-with-insights.md`

### Tasks

#### 2.4.1 Implement Daily Insights Generator
**Estimated Time:** 2 hours

Erstelle `app/lib/ai/daily-insights.ts`:

```typescript
import { anthropic, selectModel } from './client'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const InsightSchema = z.object({
  type: z.enum(['trend', 'warning', 'tip', 'achievement']),
  title: z.string(),
  message: z.string(),
  action: z.object({
    label: z.string(),
    href: z.string(),
  }).nullable(),
})

export async function generateDailyInsight(userId: string) {
  // Gather last 7 workouts with feedback
  const recentFeedback = await prisma.workoutFeedback.findMany({
    where: { userId },
    include: { workout: true },
    orderBy: { createdAt: 'desc' },
    take: 7,
  })

  if (recentFeedback.length === 0) {
    return {
      type: 'tip',
      title: 'Willkommen!',
      message: 'Absolviere dein erstes Training und gib Feedback.',
      action: null,
    }
  }

  // Calculate stats
  const avgFeeling =
    recentFeedback.reduce((sum, fb) => sum + fb.feeling, 0) / recentFeedback.length
  const avgDifficulty =
    recentFeedback.reduce((sum, fb) => sum + fb.perceivedDifficulty, 0) /
    recentFeedback.length

  const prompt = `Generate a daily insight for an athlete based on their recent training.

Recent workouts (last 7):
${recentFeedback
  .map(
    (fb) =>
      `- ${fb.workout.type}: Feeling ${fb.feeling}/5, Difficulty ${fb.perceivedDifficulty}/10`
  )
  .join('\n')}

Average feeling: ${avgFeeling.toFixed(1)}/5
Average difficulty: ${avgDifficulty.toFixed(1)}/10

Return ONE insight as JSON matching the schema.`

  const response = await anthropic.messages.create({
    model: selectModel('simple'),
    max_tokens: 256,
    temperature: 0.5,
    system: 'You are a supportive endurance coach providing daily insights.',
    messages: [{ role: 'user', content: prompt }],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No response')
  }

  const parsed = JSON.parse(textContent.text)
  return InsightSchema.parse(parsed)
}
```

**Verification:**
- [ ] generateDailyInsight funktioniert
- [ ] Returns valid insight
- [ ] Different types basierend auf Daten

---

## Milestone 2.5: Testing & Optimization

### Tasks

#### 2.5.1 Cost Optimization
**Estimated Time:** 1 hour

Implementiere Prompt Caching:

```typescript
// In plan-generator.ts - Update callClaudeForPlan
const response = await anthropic.messages.create({
  model: selectModel('complex'),
  max_tokens: 4096,
  temperature: 0.3,
  system: [
    {
      type: 'text',
      text: 'You are an expert endurance sports coach...',
      cache_control: { type: 'ephemeral' }, // CACHE THIS
    },
    {
      type: 'text',
      text: trainwikiDocs, // CACHE TRAINWIKI
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [{ role: 'user', content: prompt }],
})
```

**Expected Savings:** ~90% auf repeat calls

**Verification:**
- [ ] Zweite Plan-Generation deutlich günstiger
- [ ] Cache Headers in Response

---

#### 2.5.2 Integration Tests
**Estimated Time:** 2 hours

Erstelle `tests/ai/plan-generation.test.ts`:

```typescript
import { generateTrainingPlan } from '@/lib/ai/plan-generator'
import { prisma } from '@/lib/prisma'

describe('Plan Generation', () => {
  it('should generate valid 2-week plan', async () => {
    const userId = 'test-user-id'

    const plan = await generateTrainingPlan(userId)

    expect(plan.week1).toHaveLength(7)
    expect(plan.week2).toHaveLength(7)
    expect(plan.rationale).toBeTruthy()
  })

  it('should respect 80/20 rule', async () => {
    const plan = await generateTrainingPlan('test-user-id')

    const allWorkouts = [...plan.week1, ...plan.week2]
    const easyWorkouts = allWorkouts.filter((w) =>
      ['Z1', 'Z2'].includes(w.intensityZone || '')
    )

    const easyPercent = (easyWorkouts.length / allWorkouts.length) * 100
    expect(easyPercent).toBeGreaterThanOrEqual(70)
  })
})
```

**Verification:**
- [ ] Tests laufen durch
- [ ] Alle Assertions grün

---

## Success Criteria

Phase 2 ist **erfolgreich abgeschlossen**, wenn:

- ✅ AI generiert valide Trainingspläne (< 15 Sekunden)
- ✅ Plan validation funktioniert (80/20, Progression, etc.)
- ✅ Constraint Parser funktioniert (70%+ Accuracy)
- ✅ Feedback Collection funktioniert
- ✅ Daily Insights werden generiert
- ✅ Kosten < $0.50 pro Plan
- ✅ Prompt Caching implementiert
- ✅ Keine kritischen AI Errors

---

## Rollback Plan

Falls Phase 2 fehlschlägt:

1. **AI Kosten zu hoch:** Zurück zu statischen Templates
2. **Plan Validation fails:** Manual Review Mode
3. **Constraint Parser zu ungenau:** Fallback zu Form Input

---

## Next Steps

Nach erfolgreicher Phase 2:

1. ✅ **Review AI Performance** (Kosten, Qualität, Geschwindigkeit)
2. ✅ **User Testing** (Sind Pläne sinnvoll?)
3. ⬜ **Start Phase 3:** User Features → [phase-3-user-features.md](./phase-3-user-features.md)

---

**Estimated Total Time:** 50-70 hours
**Critical Path:** Plan Generation → Validation → Testing
**Biggest Risk:** AI Plan Quality
**Mitigation:** Multi-layer validation, manual review option

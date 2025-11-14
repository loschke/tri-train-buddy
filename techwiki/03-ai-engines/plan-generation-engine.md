# Plan Generation Engine

## Overview

The Plan Generation Engine is the **core AI component** that creates personalized 14-day training plans. It combines:
1. Athlete context (profile, preferences, history)
2. Training science (from trainwiki/)
3. User constraints (schedule, travel, etc.)
4. Learning from feedback

---

## Architecture

```
┌────────────────────────────────────────┐
│  API Request: Generate Plan            │
│  POST /api/plan/generate                │
└────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  1. Gather Context                     │
│  - Athlete Profile                     │
│  - Latest Metrics                      │
│  - Preferences (learned)               │
│  - Constraints (parsed)                │
│  - Previous Plan Feedback              │
└────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  2. Determine Training Phase           │
│  - Calculate weeks to goal             │
│  - Map to phase (Base/Build/Peak/Taper)│
│  - Select appropriate trainwiki docs   │
└────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  3. Build AI Prompt                    │
│  - Include relevant trainwiki content  │
│  - Athlete snapshot                    │
│  - Phase-specific instructions         │
│  - Constraints & preferences           │
└────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  4. Call Claude API                    │
│  - generateObject with Zod schema      │
│  - Structured 14-day plan output       │
└────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  5. Validate Plan                      │
│  - Volume progression safe?            │
│  - 80/20 distribution?                 │
│  - Recovery adequate?                  │
│  - Constraints respected?              │
└────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  6. Enrich with Explanations           │
│  - Add educational layer               │
│  - Mark first-time workouts            │
│  - Generate execution tips             │
└────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  7. Save to Database                   │
│  - Create TrainingPlan record          │
│  - Create 14 Workout records           │
│  - Mark previous plan as COMPLETED     │
└────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  8. Return to User                     │
│  - Plan summary                        │
│  - Rationale                           │
│  - Next steps                          │
└────────────────────────────────────────┘
```

---

## Implementation

### Step 1: Gather Context

```typescript
async function gatherPlanContext(userId: string) {
  const [profile, preferences, previousPlan, constraints] = await Promise.all([
    prisma.athleteProfile.findUnique({ where: { userId } }),
    prisma.athletePreference.findMany({
      where: { userId, active: true, confidence: { gte: 0.7 } }
    }),
    prisma.trainingPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { workouts: true }
    }),
    // User-provided constraints from request body
  ])

  if (!profile) {
    throw new Error('Athlete profile not found - complete onboarding first')
  }

  return {
    profile,
    preferences,
    previousPlan,
    constraints
  }
}
```

---

### Step 2: Determine Training Phase

```typescript
function determinePhase(goalDate: Date): {
  phase: TrainingPhase
  weeksToGoal: number
  focusAreas: string[]
} {
  const now = new Date()
  const weeksToGoal = differenceInWeeks(goalDate, now)

  if (weeksToGoal < 4) {
    return {
      phase: 'TAPER',
      weeksToGoal,
      focusAreas: ['recovery', 'sharpening', 'mental-prep']
    }
  } else if (weeksToGoal < 8) {
    return {
      phase: 'PEAK',
      weeksToGoal,
      focusAreas: ['race-pace', 'intensity', 'specificity']
    }
  } else if (weeksToGoal < 16) {
    return {
      phase: 'BUILD',
      weeksToGoal,
      focusAreas: ['volume', 'threshold', 'endurance']
    }
  } else {
    return {
      phase: 'BASE',
      weeksToGoal,
      focusAreas: ['aerobic-base', 'technique', 'consistency']
    }
  }
}
```

---

### Step 3: Build AI Prompt

```typescript
async function buildPlanGenerationPrompt(context: PlanContext) {
  const { profile, preferences, previousPlan, constraints, phase } = context

  // Load relevant trainwiki docs
  const trainingKnowledge = await loadTrainwikiDocs([
    'core/periodization.md',
    'core/80-20-rule.md',
    'core/recovery.md',
    phase.phase === 'BASE' ? 'core/load-management.md' : null,
    profile.goalType === 'MARATHON' ? 'combinations/running-focused.md' : null,
    profile.goalType.includes('IRONMAN') ? 'combinations/triathlon.md' : null
  ].filter(Boolean))

  const prompt = `
${trainingKnowledge}

# ATHLETE PROFILE

Goal: ${profile.goal}
Goal Date: ${profile.goalDate}
Weeks to Goal: ${phase.weeksToGoal}
Current Phase: ${phase.phase}

Current Level:
${JSON.stringify(profile.currentLevel, null, 2)}

Availability:
${JSON.stringify(profile.availability, null, 2)}

Injury History:
${profile.injuryHistory.join(', ') || 'None reported'}

Risk Profile: ${profile.riskProfile}
Max Weekly Increase: ${profile.maxWeeklyIncrease * 100}%

# LEARNED PREFERENCES

${preferences.map(p => `
- ${p.key}: ${JSON.stringify(p.value)}
  (confidence: ${p.confidence}, based on ${p.dataPoints} observations)
`).join('\n')}

# PREVIOUS PLAN FEEDBACK

${previousPlan?.feedback || 'First plan - no previous feedback'}

# USER CONSTRAINTS FOR THIS CYCLE

${constraints.userInput || 'No specific constraints'}

${constraints.parsed ? 
  `Parsed Constraints:
  ${JSON.stringify(constraints.parsed, null, 2)}`
  : ''
}

# YOUR TASK

Generate a 14-day training plan (2 weeks) that:

1. **Respects Training Science**
   - Follow periodization principles for ${phase.phase} phase
   - Maintain 80/20 intensity distribution
   - Include appropriate recovery
   - Progressive overload within safe limits

2. **Personalizes to Athlete**
   - Respect current level (don't start too hard)
   - Honor availability constraints
   - Apply learned preferences
   - Consider injury history (conservative progression)

3. **Adapts to Constraints**
   - Work around user's schedule conflicts
   - Adjust for travel/equipment limitations
   - Maintain training effectiveness despite constraints

4. **Educates the Athlete**
   - Each workout should have clear purpose
   - Explain WHY this workout, not just WHAT

# OUTPUT FORMAT

Provide a structured JSON plan with:
- Week 1: 7 daily workouts (Monday-Sunday)
- Week 2: 7 daily workouts
- Rationale: Why this plan is appropriate for this athlete at this time
- Educational Notes: Key learnings for this cycle

Each workout must include:
- date, dayOfWeek, discipline, type
- durationMin, intensityZone
- title, description (detailed instructions)
- explanation (why doing this workout)
- executionTips (how to do it well)

CRITICAL RULES:
- Never exceed ${profile.maxWeeklyIncrease * 100}% volume increase
- If previous plan felt "too hard", reduce by 10-15%
- Always include at least 1-2 rest days per week
- Respect run tolerance if specified: ${profile.runToleranceKm || 'Not specified'} km/week max
- Honor learned preferences (e.g., ${preferences[0]?.key || 'none yet'})

Generate the plan now.
`

  return prompt
}
```

---

### Step 4: Call Claude API

```typescript
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const workoutSchema = z.object({
  date: z.string(),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  discipline: z.enum(['RUN', 'BIKE', 'SWIM', 'STRENGTH', 'BRICK', 'REST', 'ACTIVE_RECOVERY']),
  type: z.enum(['EASY', 'LONG', 'TEMPO', 'THRESHOLD', 'INTERVALS', 'VO2MAX', 'RECOVERY', 'STRENGTH', 'BRICK', 'REST']),
  durationMin: z.number().min(0).max(360),
  intensityZone: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  explanation: z.string(),
  executionTips: z.string().optional()
})

const planSchema = z.object({
  week1: z.array(workoutSchema).length(7),
  week2: z.array(workoutSchema).length(7),
  rationale: z.string(),
  educationalNotes: z.string().optional(),
  weeklyVolumeProgression: z.object({
    week1Minutes: z.number(),
    week2Minutes: z.number(),
    increasePercent: z.number()
  })
})

async function generatePlanWithAI(prompt: string) {
  const result = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: planSchema,
    prompt,
    temperature: 0.7, // Some creativity, but not too random
    maxTokens: 8000   // Long output needed
  })

  return result.object
}
```

---

### Step 5: Validate Plan

```typescript
function validatePlan(plan: z.infer<typeof planSchema>, context: PlanContext) {
  const errors: string[] = []

  // 1. Volume Progression
  const { week1Minutes, week2Minutes, increasePercent } = plan.weeklyVolumeProgression
  const previousVolume = context.previousPlan?.weeklyVolume || week1Minutes

  const actualIncrease = (week1Minutes - previousVolume) / previousVolume
  if (actualIncrease > context.profile.maxWeeklyIncrease) {
    errors.push(
      `Volume increase ${(actualIncrease * 100).toFixed(1)}% exceeds safe limit of ${context.profile.maxWeeklyIncrease * 100}%`
    )
  }

  // 2. Intensity Distribution (80/20 rule)
  const allWorkouts = [...plan.week1, ...plan.week2]
  const totalMinutes = allWorkouts.reduce((sum, w) => sum + w.durationMin, 0)
  
  const easyMinutes = allWorkouts
    .filter(w => ['EASY', 'LONG', 'RECOVERY', 'REST'].includes(w.type))
    .reduce((sum, w) => sum + w.durationMin, 0)

  const easyPercentage = easyMinutes / totalMinutes
  if (easyPercentage < 0.75) {
    errors.push(
      `Easy percentage ${(easyPercentage * 100).toFixed(1)}% is below 75% (should be 80%)`
    )
  }

  // 3. Recovery Days
  const week1Rest = plan.week1.filter(w => w.type === 'REST' || w.type === 'RECOVERY').length
  const week2Rest = plan.week2.filter(w => w.type === 'REST' || w.type === 'RECOVERY').length

  if (week1Rest < 1 || week2Rest < 1) {
    errors.push('Each week must have at least 1 rest/recovery day')
  }

  // 4. Back-to-back hard days
  for (let i = 0; i < allWorkouts.length - 1; i++) {
    const today = allWorkouts[i]
    const tomorrow = allWorkouts[i + 1]

    const hardTypes = ['INTERVALS', 'VO2MAX', 'THRESHOLD', 'LONG']
    if (hardTypes.includes(today.type) && hardTypes.includes(tomorrow.type)) {
      errors.push(
        `Back-to-back hard days on ${today.dayOfWeek}/${tomorrow.dayOfWeek}`
      )
    }
  }

  // 5. Run Tolerance (if specified)
  if (context.profile.runToleranceKm) {
    const runWorkouts = allWorkouts.filter(w => w.discipline === 'RUN')
    const estimatedKm = runWorkouts.reduce((sum, w) => {
      // Estimate km: assume 6 min/km average
      return sum + (w.durationMin / 6)
    }, 0)

    const weeklyKm = estimatedKm / 2 // Average over 2 weeks
    if (weeklyKm > context.profile.runToleranceKm) {
      errors.push(
        `Weekly run volume ${weeklyKm.toFixed(1)}km exceeds tolerance of ${context.profile.runToleranceKm}km`
      )
    }
  }

  // 6. Constraints Respected
  if (context.constraints.parsed) {
    const conflicts = checkConstraintConflicts(plan, context.constraints.parsed)
    errors.push(...conflicts)
  }

  if (errors.length > 0) {
    throw new PlanValidationError(errors)
  }

  return true
}
```

---

### Step 6: Enrich with Explanations

```typescript
async function enrichPlan(plan: z.infer<typeof planSchema>, context: PlanContext) {
  // Mark first-time workouts
  const previousWorkoutTypes = new Set(
    context.previousPlan?.workouts.map(w => w.type) || []
  )

  const allWorkouts = [...plan.week1, ...plan.week2]
  const enrichedWorkouts = allWorkouts.map((workout, index) => {
    const isFirstOfType = !previousWorkoutTypes.has(workout.type)

    // Enhanced explanation for first-timers
    const enhancedExplanation = isFirstOfType
      ? `🆕 Erste ${workout.type} Einheit!\n\n${workout.explanation}`
      : workout.explanation

    // Add execution tips from trainwiki if not provided
    const executionTips = workout.executionTips || 
      getDefaultExecutionTips(workout.type, context.profile.currentLevel.experience)

    return {
      ...workout,
      date: addDays(context.startDate, index),
      isFirstOfType,
      explanation: enhancedExplanation,
      executionTips
    }
  })

  return {
    ...plan,
    workouts: enrichedWorkouts
  }
}

function getDefaultExecutionTips(workoutType: string, experienceLevel: string) {
  const tips = {
    EASY: {
      beginner: "Lauf so langsam, dass du dabei sprechen kannst. Wenn nicht → langsamer!",
      intermediate: "Ziel: 60-70% deiner Maximalherzfrequenz. Fühlt sich fast zu leicht an.",
      advanced: "Z1-2 pace. Watch decoupling - should be <5% on good aerobic runs."
    },
    INTERVALS: {
      beginner: "Erste Intervalle! 8/10 Anstrengung. Pause komplett ausnutzen.",
      intermediate: "Push hard auf den 'on' Phasen. Recovery vollständig zwischen Reps.",
      advanced: "Target VO2max zones. First rep should feel controlled, not all-out."
    },
    // ... more workout types
  }

  return tips[workoutType]?.[experienceLevel] || "Follow the workout description carefully."
}
```

---

### Step 7: Save to Database

```typescript
async function savePlan(enrichedPlan: EnrichedPlan, context: PlanContext) {
  // Create TrainingPlan
  const plan = await prisma.trainingPlan.create({
    data: {
      userId: context.userId,
      name: `${context.phase.phase} - ${format(context.startDate, 'MMM d')}`,
      startDate: context.startDate,
      endDate: addDays(context.startDate, 14),
      status: 'ACTIVE',
      phase: context.phase.phase,
      generatedAt: new Date(),
      generatedBy: 'claude-sonnet-4-20250514',
      generationPrompt: context.prompt, // Store for debugging
      athleteSnapshot: context.profile,
      constraints: context.constraints,
      feedback: context.previousPlan?.feedback,
      weeklyVolume: enrichedPlan.weeklyVolumeProgression.week1Minutes,
      volumeProgression: enrichedPlan.weeklyVolumeProgression.increasePercent / 100,
      intensityDistribution: calculateIntensityDistribution(enrichedPlan.workouts),
      rationale: enrichedPlan.rationale,
      educationalNotes: enrichedPlan.educationalNotes
    }
  })

  // Create Workouts
  await prisma.workout.createMany({
    data: enrichedPlan.workouts.map(w => ({
      planId: plan.id,
      userId: context.userId,
      date: w.date,
      dayOfWeek: w.dayOfWeek,
      discipline: w.discipline,
      type: w.type,
      durationMin: w.durationMin,
      intensityZone: w.intensityZone,
      title: w.title,
      description: w.description,
      explanation: w.explanation,
      executionTips: w.executionTips,
      isFirstOfType: w.isFirstOfType,
      completed: false
    }))
  })

  // Mark previous plan as COMPLETED
  if (context.previousPlan) {
    await prisma.trainingPlan.update({
      where: { id: context.previousPlan.id },
      data: { status: 'COMPLETED' }
    })
  }

  return plan
}
```

---

## Error Handling

### Retry Strategy

```typescript
async function generatePlanWithRetry(context: PlanContext, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const prompt = await buildPlanGenerationPrompt(context)
      const plan = await generatePlanWithAI(prompt)
      validatePlan(plan, context)
      return plan
    } catch (error) {
      if (error instanceof PlanValidationError) {
        console.error(`Plan validation failed (attempt ${attempt + 1}):`, error.errors)

        if (attempt < maxRetries) {
          // Adjust prompt to fix common issues
          context.prompt = adjustPromptBasedOnError(context.prompt, error)
          continue
        }
      }

      if (attempt === maxRetries) {
        // All attempts failed
        throw new Error(`Failed to generate valid plan after ${maxRetries + 1} attempts`)
      }
    }
  }
}
```

---

## Cost Optimization

### Prompt Caching

```typescript
// Cache trainwiki content (it doesn't change often)
const cachedTrainwikiContent = await redis.get('trainwiki:full')

if (!cachedTrainwikiContent) {
  const content = await loadTrainwikiDocs(allDocs)
  await redis.set('trainwiki:full', content, 'EX', 3600 * 24) // 24h cache
}
```

### Minimize Token Usage

```typescript
// Only include relevant sections
function selectRelevantTrainwiki(phase: TrainingPhase, goalType: GoalType) {
  const core = [
    'core/periodization.md',
    'core/80-20-rule.md'
  ]

  const phaseSpecific = {
    BASE: ['core/load-management.md'],
    BUILD: ['core/recovery.md'],
    PEAK: [],
    TAPER: []
  }

  const sportSpecific = {
    MARATHON: ['combinations/running-focused.md'],
    IRONMAN: ['combinations/triathlon.md'],
    // ... more
  }

  return [
    ...core,
    ...phaseSpecific[phase],
    ...sportSpecific[goalType]
  ]
}
```

---

## Monitoring & Debugging

### Log All Generations

```typescript
await prisma.aiGenerationLog.create({
  data: {
    planId: plan.id,
    model: 'claude-sonnet-4-20250514',
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalCost: calculateCost(result.usage),
    validationPassed: true,
    retryCount: attempt
  }
})
```

### A/B Testing

```typescript
// Test different prompting strategies
const variant = getUserVariant(userId) // A or B

const promptStrategy = variant === 'A'
  ? buildPromptV1(context)
  : buildPromptV2(context) // More detailed instructions

// Track which performs better (user feedback)
```

---

**Next:** Conversational Interface Engine

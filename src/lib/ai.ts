import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import { TrainingRules } from '@/types'
import { differenceInWeeks } from 'date-fns'

const sessionSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  date: z.string(),
  discipline: z.enum(['RUN', 'BIKE', 'SWIM', 'GYM', 'REST']),
  durationMinutes: z.number(),
  intensityZone: z.string().nullable(),
  description: z.string(),
})

const planSchema = z.object({
  week1: z.array(sessionSchema),
  week2: z.array(sessionSchema),
  rationale: z.string(),
})

interface GeneratePlanParams {
  athleteProfile: {
    raceDate: Date
    goalTime: string
    trainingRules: TrainingRules
  }
  performanceMetrics: {
    runThresholdPace: string
    runToleranceKm: number
    ftpWatts: number
    swimPacePer100m: string
    trainingReadiness?: number | null
    trainingLoad?: string | null
  }
  feedback?: string
  constraints?: string
  startDate: Date
}

export async function generateTrainingPlan(params: GeneratePlanParams) {
  const {
    athleteProfile,
    performanceMetrics,
    feedback = '',
    constraints = '',
    startDate,
  } = params

  const weeksUntilRace = differenceInWeeks(
    athleteProfile.raceDate,
    startDate
  )

  // Determine training phase
  let trainingPhase = 'Base'
  if (weeksUntilRace < 4) {
    trainingPhase = 'Taper'
  } else if (weeksUntilRace < 8) {
    trainingPhase = 'Peak'
  } else if (weeksUntilRace < 16) {
    trainingPhase = 'Build'
  }

  const prompt = `You are an experienced triathlon coach. Generate a 14-day training plan for an Ironman athlete.

**Athlete Context:**
- Race Date: ${athleteProfile.raceDate.toISOString().split('T')[0]}
- Weeks Until Race: ${weeksUntilRace}
- Goal Time: ${athleteProfile.goalTime}
- Current Phase: ${trainingPhase} (Base/Build/Peak/Taper based on weeks)

**Current Performance:**
- Run Threshold Pace: ${performanceMetrics.runThresholdPace} min/km
- Run Tolerance: ${performanceMetrics.runToleranceKm} km/week
- FTP: ${performanceMetrics.ftpWatts} watts
- Swim Pace: ${performanceMetrics.swimPacePer100m} per 100m
${performanceMetrics.trainingReadiness ? `- Training Readiness: ${performanceMetrics.trainingReadiness}/100` : ''}
${performanceMetrics.trainingLoad ? `- Training Load: ${performanceMetrics.trainingLoad}` : ''}

**Training Rules:**
- Monday: ${athleteProfile.trainingRules.mondayRest ? 'Always rest day' : 'Training allowed'}
- Friday/Saturday/Sunday: Long sessions or double sessions possible
- Bike: ${athleteProfile.trainingRules.minBikePerWeek}-${athleteProfile.trainingRules.maxBikePerWeek}x per week
- Run: ${athleteProfile.trainingRules.minRunPerWeek}-${athleteProfile.trainingRules.maxRunPerWeek}x per week
- Swim: Max ${athleteProfile.trainingRules.maxSwimPerWeek}x per week
- Gym: ${athleteProfile.trainingRules.gymPerWeek}x per week (combinable with run/bike up to 1h)

${feedback ? `**Last Cycle Feedback:**\n${feedback}\n` : ''}

${constraints ? `**Constraints for Next 14 Days:**\n${constraints}\n` : ''}

**Instructions:**
1. Create a periodized 14-day plan appropriate for the ${trainingPhase} training phase
2. Respect the athlete's run tolerance (don't exceed ${performanceMetrics.runToleranceKm} km/week)
3. Keep training load progressive but manageable
4. 80% of training should be Zone 1-2 (base endurance)
5. Include specific workouts with zones, durations, and clear descriptions
6. Consider the constraints provided
7. Include at least one brick workout (bike→run) per cycle
8. Provide a brief rationale for this plan phase

**Important:**
- Monday must be REST if mondayRest is true
- Provide realistic, specific workout descriptions
- Use proper zone designations (Z1, Z2, Tempo, Threshold, etc.)
- Include warm-up and cool-down in descriptions

Return a structured response with:
- week1: Array of 7 sessions (Monday-Sunday) starting from the provided date
- week2: Array of 7 sessions for the following week
- rationale: Brief explanation of the plan

Each session must include:
- day: Day of week (Monday, Tuesday, etc.)
- date: ISO date string
- discipline: RUN, BIKE, SWIM, GYM, or REST
- durationMinutes: Total duration in minutes
- intensityZone: "Z1" | "Z2" | "Tempo" | "Threshold" | "VO2max" | null (for REST)
- description: Detailed workout description with paces/watts/intervals`

  const result = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: planSchema,
    prompt,
  })

  return result.object
}

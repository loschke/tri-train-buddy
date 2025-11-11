import { Discipline, CycleStatus } from '@prisma/client'

export type { Discipline, CycleStatus }

export interface TrainingRules {
  mondayRest: boolean
  weekendLong: boolean
  minBikePerWeek: number
  maxBikePerWeek: number
  minRunPerWeek: number
  maxRunPerWeek: number
  maxSwimPerWeek: number
  gymPerWeek: number
}

export interface SessionData {
  day: string
  date: string
  discipline: Discipline
  durationMinutes: number
  intensityZone: string | null
  description: string
}

export interface GeneratedPlan {
  week1: SessionData[]
  week2: SessionData[]
  rationale: string
}

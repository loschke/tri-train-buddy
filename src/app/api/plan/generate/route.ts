import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTrainingPlan } from '@/lib/ai'
import { headers } from 'next/headers'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { feedback, constraints, startDate: startDateStr } = body

    // Get athlete profile
    const profile = await prisma.athleteProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Athlete profile not found. Complete onboarding first.' },
        { status: 404 }
      )
    }

    // Get latest metrics
    const metrics = await prisma.performanceMetric.findFirst({
      where: { userId: session.user.id },
      orderBy: { recordedAt: 'desc' },
    })

    if (!metrics) {
      return NextResponse.json(
        { error: 'Performance metrics not found. Complete onboarding first.' },
        { status: 404 }
      )
    }

    const startDate = startDateStr ? new Date(startDateStr) : new Date()

    // Generate plan using Claude
    const generatedPlan = await generateTrainingPlan({
      athleteProfile: {
        raceDate: profile.raceDate,
        goalTime: profile.goalTime,
        trainingRules: profile.trainingRules as any,
      },
      performanceMetrics: {
        runThresholdPace: metrics.runThresholdPace,
        runToleranceKm: metrics.runToleranceKm,
        ftpWatts: metrics.ftpWatts,
        swimPacePer100m: metrics.swimPacePer100m,
        trainingReadiness: metrics.trainingReadiness,
        trainingLoad: metrics.trainingLoad,
      },
      feedback,
      constraints,
      startDate,
    })

    // Save training cycle
    const endDate = addDays(startDate, 13)
    const cycle = await prisma.trainingCycle.create({
      data: {
        userId: session.user.id,
        startDate,
        endDate,
        feedback,
        constraints,
        status: 'ACTIVE',
        generatedPlan: generatedPlan as any,
        rationale: generatedPlan.rationale,
      },
    })

    // Save training sessions
    const allSessions = [...generatedPlan.week1, ...generatedPlan.week2]
    await Promise.all(
      allSessions.map((sessionData) =>
        prisma.trainingSession.create({
          data: {
            cycleId: cycle.id,
            date: new Date(sessionData.date),
            discipline: sessionData.discipline,
            durationMinutes: sessionData.durationMinutes,
            intensityZone: sessionData.intensityZone,
            description: sessionData.description,
          },
        })
      )
    )

    // Mark any previous active cycles as completed
    await prisma.trainingCycle.updateMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        id: { not: cycle.id },
      },
      data: { status: 'COMPLETED' },
    })

    return NextResponse.json({
      cycle,
      plan: generatedPlan,
    })
  } catch (error) {
    console.error('Plan generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      runThresholdPace,
      runToleranceKm,
      ftpWatts,
      swimPacePer100m,
      trainingReadiness,
      trainingLoad,
      notes,
    } = body

    const metric = await prisma.performanceMetric.create({
      data: {
        userId: session.user.id,
        runThresholdPace,
        runToleranceKm,
        ftpWatts,
        swimPacePer100m,
        trainingReadiness,
        trainingLoad,
        notes,
      },
    })

    return NextResponse.json(metric)
  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to save metrics' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metrics = await prisma.performanceMetric.findMany({
      where: { userId: session.user.id },
      orderBy: { recordedAt: 'desc' },
      take: 10,
    })

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

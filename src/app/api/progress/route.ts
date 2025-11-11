import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { format, startOfWeek } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all training cycles for the user
    const cycles = await prisma.trainingCycle.findMany({
      where: { userId: session.user.id },
      include: {
        sessions: true,
      },
      orderBy: { startDate: 'asc' },
    })

    // Calculate overall stats
    const allSessions = cycles.flatMap(c => c.sessions)
    const totalSessions = allSessions.length
    const completedSessions = allSessions.filter(s => s.completed).length
    const completionRate = totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0

    // Calculate weekly volumes
    const weeklyVolumes = new Map<string, {
      run: number
      bike: number
      swim: number
      total: number
    }>()

    allSessions.forEach(session => {
      if (!session.completed) return

      const weekStart = startOfWeek(new Date(session.date))
      const weekKey = format(weekStart, 'MMM d')

      const current = weeklyVolumes.get(weekKey) || {
        run: 0,
        bike: 0,
        swim: 0,
        total: 0,
      }

      if (session.discipline === 'RUN') {
        current.run += session.durationMinutes
      } else if (session.discipline === 'BIKE') {
        current.bike += session.durationMinutes
      } else if (session.discipline === 'SWIM') {
        current.swim += session.durationMinutes
      }
      current.total += session.durationMinutes

      weeklyVolumes.set(weekKey, current)
    })

    const weeklyVolumesArray = Array.from(weeklyVolumes.entries())
      .map(([week, data]) => ({
        week,
        ...data,
      }))
      .slice(-8) // Last 8 weeks

    return NextResponse.json({
      totalSessions,
      completedSessions,
      completionRate,
      weeklyVolumes: weeklyVolumesArray,
    })
  } catch (error) {
    console.error('Progress API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

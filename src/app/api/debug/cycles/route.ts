import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { startOfDay, addDays, format } from 'date-fns'

/**
 * DEBUG ENDPOINT
 * GET /api/debug/cycles
 *
 * Zeigt alle Cycles und Sessions für den eingeloggten User
 * Hilft beim Debuggen warum Sessions nicht angezeigt werden
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Alle Cycles für User
    const cycles = await prisma.trainingCycle.findMany({
      where: { userId: session.user.id },
      include: {
        sessions: {
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Aktiver Cycle
    const activeCycle = cycles.find(c => c.status === 'ACTIVE')

    // Heute + nächste 7 Tage
    const today = startOfDay(new Date())
    const nextWeek = addDays(today, 7)

    const upcomingSessions = activeCycle?.sessions.filter(
      (session) => {
        const sessionDate = new Date(session.date)
        return sessionDate >= today && sessionDate < nextWeek
      }
    ) || []

    const debugInfo = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      datetime: {
        now: new Date().toISOString(),
        today: today.toISOString(),
        nextWeek: nextWeek.toISOString(),
        todayFormatted: format(today, 'PPP'),
        nextWeekFormatted: format(nextWeek, 'PPP'),
      },
      cycles: {
        total: cycles.length,
        active: cycles.filter(c => c.status === 'ACTIVE').length,
        planned: cycles.filter(c => c.status === 'PLANNED').length,
        completed: cycles.filter(c => c.status === 'COMPLETED').length,
      },
      activeCycle: activeCycle ? {
        id: activeCycle.id,
        status: activeCycle.status,
        startDate: activeCycle.startDate,
        endDate: activeCycle.endDate,
        totalSessions: activeCycle.sessions.length,
        sessionsInNext7Days: upcomingSessions.length,
      } : null,
      upcomingSessions: upcomingSessions.map(s => ({
        id: s.id,
        date: s.date,
        dateFormatted: format(new Date(s.date), 'PPP'),
        discipline: s.discipline,
        duration: s.durationMinutes,
        completed: s.completed,
      })),
      allCycles: cycles.map(c => ({
        id: c.id,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        sessionCount: c.sessions.length,
        sessions: c.sessions.map(s => ({
          date: s.date,
          dateFormatted: format(new Date(s.date), 'PPP'),
          discipline: s.discipline,
          completed: s.completed,
        })),
      })),
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    console.error('Debug cycles error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch debug info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

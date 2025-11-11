import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { format, startOfWeek, addDays } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function getCycleData(cycleId: string, userId: string) {
  const cycle = await prisma.trainingCycle.findFirst({
    where: {
      id: cycleId,
      userId,
    },
    include: {
      sessions: {
        orderBy: { date: 'asc' },
      },
    },
  })

  if (!cycle) {
    return null
  }

  // Group sessions by week
  const week1Start = new Date(cycle.startDate)
  const week2Start = addDays(week1Start, 7)

  const week1Sessions = cycle.sessions.filter(
    (s: typeof cycle.sessions[0]) => s.date >= week1Start && s.date < week2Start
  )
  const week2Sessions = cycle.sessions.filter(
    (s: typeof cycle.sessions[0]) => s.date >= week2Start
  )

  return {
    cycle,
    week1Sessions,
    week2Sessions,
  }
}

async function toggleSessionComplete(sessionId: string) {
  'use server'

  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
  })

  if (session) {
    await prisma.trainingSession.update({
      where: { id: sessionId },
      data: { completed: !session.completed },
    })
  }
}

export default async function CyclePage({
  params,
}: {
  params: Promise<{ cycleId: string }>
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const data = await getCycleData(resolvedParams.cycleId, session.user.id)

  if (!data) {
    redirect('/dashboard')
  }

  const { cycle, week1Sessions, week2Sessions } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Cycle</h1>
          <p className="text-muted-foreground">
            {format(new Date(cycle.startDate), 'MMM d')} - {format(new Date(cycle.endDate), 'MMM d, yyyy')}
          </p>
        </div>
        <Link href="/plan/new">
          <Button>Generate New Cycle</Button>
        </Link>
      </div>

      {cycle.rationale && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Rationale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{cycle.rationale}</p>
          </CardContent>
        </Card>
      )}

      {/* Week 1 */}
      <Card>
        <CardHeader>
          <CardTitle>Week 1</CardTitle>
          <CardDescription>
            {format(new Date(cycle.startDate), 'MMM d')} - {format(addDays(new Date(cycle.startDate), 6), 'MMM d')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {week1Sessions.map((session: typeof week1Sessions[0]) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Week 2 */}
      <Card>
        <CardHeader>
          <CardTitle>Week 2</CardTitle>
          <CardDescription>
            {format(addDays(new Date(cycle.startDate), 7), 'MMM d')} - {format(new Date(cycle.endDate), 'MMM d')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {week2Sessions.map((session: typeof week2Sessions[0]) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type SessionType = NonNullable<Awaited<ReturnType<typeof getCycleData>>>['week1Sessions'][0]

function SessionCard({ session }: { session: SessionType }) {
  return (
    <div className={`p-4 border rounded-lg ${session.completed ? 'bg-green-50 border-green-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`px-2 py-1 rounded text-xs font-semibold ${
              session.discipline === 'RUN' ? 'bg-blue-100 text-blue-700' :
              session.discipline === 'BIKE' ? 'bg-green-100 text-green-700' :
              session.discipline === 'SWIM' ? 'bg-cyan-100 text-cyan-700' :
              session.discipline === 'GYM' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {session.discipline}
            </div>
            <span className="font-semibold">{format(new Date(session.date), 'EEEE, MMM d')}</span>
            <span className="text-sm text-muted-foreground">
              {session.durationMinutes} min
            </span>
            {session.intensityZone && (
              <span className="text-sm text-muted-foreground">
                {session.intensityZone}
              </span>
            )}
          </div>
          <p className="text-sm">{session.description}</p>
        </div>
        <form action={toggleSessionComplete.bind(null, session.id)}>
          <Button
            type="submit"
            variant={session.completed ? "outline" : "default"}
            size="sm"
          >
            {session.completed ? "✓ Done" : "Mark Complete"}
          </Button>
        </form>
      </div>
    </div>
  )
}

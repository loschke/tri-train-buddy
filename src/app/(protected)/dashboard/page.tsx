import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { startOfDay, addDays, format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function getDashboardData(userId: string) {
  // Check if user has completed onboarding
  const profile = await prisma.athleteProfile.findUnique({
    where: { userId },
  })

  const metrics = await prisma.performanceMetric.findFirst({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
  })

  if (!profile || !metrics) {
    return { needsOnboarding: true }
  }

  // Get active training cycle
  const activeCycle = await prisma.trainingCycle.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      sessions: {
        orderBy: { date: 'asc' },
      },
    },
  })

  // Get upcoming sessions (next 7 days)
  const today = startOfDay(new Date())
  const nextWeek = addDays(today, 7)

  const upcomingSessions = activeCycle?.sessions.filter(
    (session: typeof activeCycle.sessions[0]) => session.date >= today && session.date < nextWeek
  ) || []

  // Calculate this week's stats
  const thisWeekSessions = activeCycle?.sessions.filter(
    (session: typeof activeCycle.sessions[0]) => session.date >= today && session.date < nextWeek
  ) || []

  const completedThisWeek = thisWeekSessions.filter((s: typeof thisWeekSessions[0]) => s.completed).length
  const totalThisWeek = thisWeekSessions.length

  return {
    needsOnboarding: false,
    profile,
    activeCycle,
    upcomingSessions,
    stats: {
      completedThisWeek,
      totalThisWeek,
      completionRate: totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0,
    },
  }
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/login')
  }

  const data = await getDashboardData(session.user.id)

  if (data.needsOnboarding) {
    redirect('/onboarding')
  }

  const { profile, activeCycle, upcomingSessions, stats } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {profile && `Race date: ${format(new Date(profile.raceDate), 'PPP')} | Goal: ${profile.goalTime}`}
          </p>
        </div>
        {!activeCycle && (
          <Link href="/plan/new">
            <Button>Generate New Plan</Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
            <CardDescription>Completion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.completionRate}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats?.completedThisWeek} of {stats?.totalThisWeek} sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Cycle</CardTitle>
            <CardDescription>Current Training Period</CardDescription>
          </CardHeader>
          <CardContent>
            {activeCycle ? (
              <>
                <div className="text-2xl font-bold">Week {Math.ceil((new Date().getTime() - new Date(activeCycle.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(activeCycle.startDate), 'MMM d')} - {format(new Date(activeCycle.endDate), 'MMM d')}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No active cycle</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Action</CardTitle>
            <CardDescription>What's coming up</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions && upcomingSessions.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{upcomingSessions[0].discipline}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(upcomingSessions[0].date), 'EEEE, MMM d')}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming sessions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Next 7 Days</CardTitle>
          <CardDescription>Your upcoming training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSessions && upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        session.discipline === 'RUN' ? 'bg-blue-100 text-blue-700' :
                        session.discipline === 'BIKE' ? 'bg-green-100 text-green-700' :
                        session.discipline === 'SWIM' ? 'bg-cyan-100 text-cyan-700' :
                        session.discipline === 'GYM' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {session.discipline}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(session.date), 'EEEE, MMM d')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {session.durationMinutes} min
                      </span>
                      {session.intensityZone && (
                        <span className="text-sm text-muted-foreground">
                          {session.intensityZone}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm">{session.description}</p>
                  </div>
                  <div>
                    {session.completed ? (
                      <span className="text-sm text-green-600 font-semibold">✓ Done</span>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/plan/${activeCycle?.id}`}>Mark Complete</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No upcoming sessions.</p>
              {!activeCycle && (
                <Link href="/plan/new" className="mt-4 inline-block">
                  <Button>Generate Your First Plan</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {activeCycle && (
        <div className="flex justify-center">
          <Link href={`/plan/${activeCycle.id}`}>
            <Button variant="outline">View Full Training Cycle</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

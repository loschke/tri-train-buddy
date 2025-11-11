import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { completed, actualNotes } = body

    // Verify the session belongs to the user
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: params.id,
        cycle: {
          userId: session.user.id,
        },
      },
    })

    if (!trainingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const updated = await prisma.trainingSession.update({
      where: { id: params.id },
      data: {
        completed: completed !== undefined ? completed : trainingSession.completed,
        actualNotes: actualNotes !== undefined ? actualNotes : trainingSession.actualNotes,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

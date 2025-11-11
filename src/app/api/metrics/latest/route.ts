import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metric = await prisma.performanceMetric.findFirst({
      where: { userId: session.user.id },
      orderBy: { recordedAt: 'desc' },
    })

    if (!metric) {
      return NextResponse.json({ error: 'No metrics found' }, { status: 404 })
    }

    return NextResponse.json(metric)
  } catch (error) {
    console.error('Latest metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest metrics' },
      { status: 500 }
    )
  }
}

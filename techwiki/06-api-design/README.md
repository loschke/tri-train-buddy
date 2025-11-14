# API Design

## Overview

Tri-Train-Buddy uses a **hybrid API architecture** combining:
1. **Next.js Server Actions** - For mutations and form submissions
2. **API Routes** - For RESTful endpoints and third-party integrations
3. **tRPC** (Future) - For type-safe client-server communication

**Key Principles:**
1. **Type Safety** - Full TypeScript coverage
2. **Authentication** - Every endpoint checks session
3. **Error Handling** - Consistent error responses
4. **Rate Limiting** - Prevent abuse (Future)
5. **Caching** - Optimize expensive operations

---

## Architecture

```
Client (Browser)
    ↓
┌───────────────────┬────────────────────┐
│                   │                    │
Server Actions   API Routes    Direct DB
(Mutations)      (REST)        (Server Components)
│                   │                    │
└───────────────────┴────────────────────┘
    ↓
Database (PostgreSQL via Prisma)
    ↓
External Services (Claude API, Email, etc.)
```

---

## 1. Server Actions

### When to Use

- Form submissions
- Data mutations (create, update, delete)
- Simple operations that don't need RESTful semantics
- When you want automatic revalidation of server components

### Example: Create Training Plan

```typescript
// File: app/actions/plans.ts

'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { generateTrainingPlan } from '@/lib/ai/plan-generator'

export async function createTrainingPlan() {
  // 1. Authenticate
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  try {
    // 2. Get athlete profile
    const profile = await prisma.athleteProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return { error: 'Profile not found' }
    }

    // 3. Generate plan
    const plan = await generateTrainingPlan(session.user.id)

    // 4. Save to database
    const savedPlan = await prisma.trainingPlan.create({
      data: {
        userId: session.user.id,
        ...plan,
      },
    })

    // 5. Revalidate dashboard
    revalidatePath('/dashboard')

    return { success: true, planId: savedPlan.id }
  } catch (error) {
    console.error('Error creating plan:', error)
    return { error: 'Failed to create plan' }
  }
}
```

### Usage in Component

```typescript
// File: app/dashboard/components/create-plan-button.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createTrainingPlan } from '@/app/actions/plans'
import { useRouter } from 'next/navigation'

export function CreatePlanButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    const result = await createTrainingPlan()

    if (result.error) {
      alert(result.error)
    } else {
      router.push(`/plans/${result.planId}`)
    }

    setLoading(false)
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? 'Erstelle...' : 'Plan erstellen'}
    </Button>
  )
}
```

---

## 2. API Routes

### When to Use

- RESTful endpoints for mobile apps or third-party integrations
- Webhooks
- File uploads
- Streaming responses
- Need full control over HTTP response

### Standard Pattern

```typescript
// File: app/api/workouts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/workouts/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workout = await prisma.workout.findUnique({
    where: { id: params.id },
    include: {
      plan: true,
      feedback: true,
    },
  })

  if (!workout) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Check ownership
  if (workout.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ workout })
}

// PATCH /api/workouts/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate input
  const UpdateSchema = z.object({
    completed: z.boolean().optional(),
    skipped: z.boolean().optional(),
    skippedReason: z.string().optional(),
  })

  const body = await req.json()
  const validation = UpdateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error },
      { status: 400 }
    )
  }

  const workout = await prisma.workout.findUnique({
    where: { id: params.id },
  })

  if (!workout || workout.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.workout.update({
    where: { id: params.id },
    data: validation.data,
  })

  return NextResponse.json({ workout: updated })
}

// DELETE /api/workouts/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workout = await prisma.workout.findUnique({
    where: { id: params.id },
  })

  if (!workout || workout.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.workout.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
```

---

## 3. Error Handling

### Standard Error Response

```typescript
interface ErrorResponse {
  error: string           // Human-readable message
  code?: string          // Machine-readable code
  details?: unknown      // Additional context (dev mode only)
}
```

### Error Handler Utility

```typescript
// File: app/lib/api-error.ts

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      },
      { status: 400 }
    )
  }

  // Log unexpected errors
  console.error('Unexpected API error:', error)

  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  )
}
```

### Usage

```typescript
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      throw new APIError('Unauthorized', 401, 'AUTH_REQUIRED')
    }

    // ... business logic

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAPIError(error)
  }
}
```

---

## 4. Authentication Middleware

### Reusable Auth Check

```typescript
// File: app/lib/api-auth.ts

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }

  return {
    error: null,
    user: session.user,
  }
}

// Usage
export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth()
  if (error) return error

  // user is guaranteed to exist here
  const data = await fetchUserData(user.id)
  return NextResponse.json({ data })
}
```

---

## 5. Validation with Zod

### Define Schemas

```typescript
// File: app/lib/validation/workout.ts

import { z } from 'zod'

export const WorkoutFeedbackSchema = z.object({
  feeling: z.number().int().min(1).max(5),
  perceivedDifficulty: z.number().int().min(1).max(10),
  notes: z.string().max(1000).optional(),
  tooHard: z.boolean().optional(),
  tooEasy: z.boolean().optional(),
  motivationLevel: z.number().int().min(1).max(5).optional(),
})

export type WorkoutFeedback = z.infer<typeof WorkoutFeedbackSchema>
```

### Use in Route

```typescript
import { WorkoutFeedbackSchema } from '@/lib/validation/workout'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validation = WorkoutFeedbackSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        details: validation.error.errors,
      },
      { status: 400 }
    )
  }

  const feedback = validation.data
  // ... save feedback
}
```

---

## 6. Rate Limiting (Future)

### Using Upstash Redis

```typescript
// File: app/lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 10 requests per 10 seconds
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

// Usage in API route
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await rateLimiter.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // ... handle request
}
```

---

## 7. Caching Strategy

### Next.js Cache Tags

```typescript
// File: app/api/plans/route.ts

import { unstable_cache } from 'next/cache'

export async function GET(req: NextRequest) {
  const { user } = await requireAuth()
  if (!user) return unauthorized()

  // Cache user's plans for 60 seconds
  const getPlans = unstable_cache(
    async (userId: string) => {
      return prisma.trainingPlan.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
    },
    ['user-plans'],
    {
      tags: [`user:${user.id}:plans`],
      revalidate: 60,
    }
  )

  const plans = await getPlans(user.id)
  return NextResponse.json({ plans })
}
```

### Revalidate Cache

```typescript
import { revalidateTag } from 'next/cache'

// After creating new plan
await prisma.trainingPlan.create({ ... })
revalidateTag(`user:${userId}:plans`)
```

---

## 8. API Documentation

### OpenAPI/Swagger (Future)

For external API consumers, document with OpenAPI:

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: Tri-Train-Buddy API
  version: 2.0.0

paths:
  /api/workouts/{id}:
    get:
      summary: Get workout by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Workout data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Workout'
        '404':
          description: Workout not found

components:
  schemas:
    Workout:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        discipline:
          type: string
          enum: [RUN, BIKE, SWIM, STRENGTH]
```

---

## 9. Endpoint Structure

### RESTful Resource Routes

```
GET    /api/workouts          - List all workouts
POST   /api/workouts          - Create workout
GET    /api/workouts/:id      - Get workout
PATCH  /api/workouts/:id      - Update workout
DELETE /api/workouts/:id      - Delete workout

POST   /api/workouts/:id/feedback      - Submit feedback
GET    /api/workouts/:id/education     - Get educational content

GET    /api/plans             - List plans
POST   /api/plans/generate    - Generate new plan
GET    /api/plans/:id         - Get plan
PATCH  /api/plans/:id         - Update plan

POST   /api/constraints/parse - Parse natural language constraint
GET    /api/constraints       - List constraints

GET    /api/insights          - Get AI insights
GET    /api/achievements      - List achievements
```

---

## 10. Testing APIs

### Integration Tests

```typescript
// File: tests/api/workouts.test.ts

import { testClient } from '@/tests/utils/test-client'

describe('GET /api/workouts/:id', () => {
  it('should return workout for authenticated user', async () => {
    const user = await createTestUser()
    const workout = await createTestWorkout({ userId: user.id })

    const response = await testClient
      .get(`/api/workouts/${workout.id}`)
      .set('Authorization', `Bearer ${user.token}`)

    expect(response.status).toBe(200)
    expect(response.body.workout.id).toBe(workout.id)
  })

  it('should return 401 for unauthenticated request', async () => {
    const response = await testClient.get('/api/workouts/123')

    expect(response.status).toBe(401)
  })

  it('should return 404 for non-existent workout', async () => {
    const user = await createTestUser()

    const response = await testClient
      .get('/api/workouts/nonexistent')
      .set('Authorization', `Bearer ${user.token}`)

    expect(response.status).toBe(404)
  })
})
```

---

## Summary

The API architecture provides:
1. **Type safety** - Full TypeScript + Zod validation
2. **Consistent patterns** - Server Actions + API Routes
3. **Security** - Authentication on every endpoint
4. **Error handling** - Standardized error responses
5. **Performance** - Caching and optimization

**Best Practices:**
- Always validate input with Zod
- Use consistent error responses
- Implement rate limiting for public endpoints
- Cache expensive operations
- Document endpoints for external consumers

---

**Next:** Deployment Strategy

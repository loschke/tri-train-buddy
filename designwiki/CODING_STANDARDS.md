# Coding Standards - Tri-Train-Buddy v2.0

## Philosophy

Write code that is:
- **Clear** over clever
- **Simple** over sophisticated
- **Consistent** with Next.js 15 patterns
- **Type-safe** always
- **AI-aware** (optimized for Claude integration)
- **Maintainable** for future developers

---

## General Principles

### 1. Follow Next.js 15 App Router Conventions
- Use Server Components by default
- Client Components only when needed
- File-based routing in `app/` directory
- Server Actions for mutations
- API Routes for external integrations

### 2. TypeScript Strict Mode
**Always enabled.** No exceptions.

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

### 3. No `any` Types
Use `unknown` with type guards instead.

```typescript
// ❌ Bad
function handleData(data: any) {
  return data.name
}

// ✅ Good
function handleData(data: unknown) {
  if (isValidData(data)) {
    return data.name
  }
  throw new Error('Invalid data')
}

function isValidData(data: unknown): data is { name: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    typeof data.name === 'string'
  )
}
```

### 4. Explicit Return Types
All functions must declare return types.

```typescript
// ❌ Bad
async function getWorkout(id: string) {
  return prisma.workout.findUnique({
    where: { id }
  })
}

// ✅ Good
async function getWorkout(id: string): Promise<Workout | null> {
  return prisma.workout.findUnique({
    where: { id }
  })
}
```

---

## File Organization

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `WorkoutCard.tsx`)
- Utils/Helpers: `kebab-case.ts` (e.g., `plan-validator.ts`)
- API Routes: `route.ts` (Next.js convention)
- Server Actions: `actions.ts` (in relevant directories)
- Types: `types.ts` or co-located with usage

**Variables & Functions:**
- Variables: `camelCase` (e.g., `currentWorkout`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_WEEKLY_VOLUME`)
- Functions: `camelCase` (e.g., `generateTrainingPlan`)
- Components: `PascalCase` (e.g., `DashboardHeader`)
- Types/Interfaces: `PascalCase` (e.g., `TrainingPlan`)

### Import Organization

Always order imports in this sequence:

```typescript
// 1. React & Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// 2. External libraries
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// 3. Internal lib/utils
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { anthropic } from '@/lib/ai/client'

// 4. AI Engines
import { generateTrainingPlan } from '@/lib/ai/plan-generator'
import { parseConstraint } from '@/lib/ai/constraint-parser'

// 5. UI Components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WorkoutCard } from '@/components/workout-card'

// 6. Types
import type { Workout, TrainingPlan } from '@prisma/client'

// 7. Styles (if any)
import styles from './component.module.css'
```

Use `@/` path alias for imports (configured in `tsconfig.json`).

---

## Component Patterns

### React Components

**Structure:**
```typescript
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Workout } from '@prisma/client'

// 2. Types/Interfaces
interface WorkoutCardProps {
  workout: Workout
  onComplete?: (id: string) => void
  showEducation?: boolean
  disabled?: boolean
}

// 3. Component
export function WorkoutCard({
  workout,
  onComplete,
  showEducation = false,
  disabled = false,
}: WorkoutCardProps) {
  // 3a. Hooks first
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  // 3b. Derived state
  const isCompleted = workout.completed
  const intensityColor = getIntensityColor(workout.intensityZone)

  // 3c. Effects
  useEffect(() => {
    // ...
  }, [])

  // 3d. Event handlers
  const handleComplete = () => {
    if (onComplete) {
      onComplete(workout.id)
    }
  }

  // 3e. Early returns for loading/error states
  if (!workout) {
    return <EmptyState />
  }

  // 3f. Main render
  return (
    <Card>
      {/* ... */}
    </Card>
  )
}
```

### Server Components vs Client Components

**Default: Server Components**
```typescript
// No 'use client' needed
export default async function DashboardPage() {
  const user = await requireAuth()
  const workouts = await prisma.workout.findMany({
    where: { userId: user.id }
  })

  return <WorkoutList workouts={workouts} />
}
```

**Client Components: Only When Needed**
```typescript
'use client'

// Use client directive only for:
// - State management (useState, useReducer)
// - Effects (useEffect)
// - Event handlers (onClick, onChange)
// - Browser APIs (window, document)
// - Interactive UI (chat, forms with real-time validation)

export function OnboardingChat() {
  const [messages, setMessages] = useState<Message[]>([])
  // ...
}
```

### Component Documentation

Add JSDoc for complex components:

```typescript
/**
 * WorkoutCard - Displays workout details with educational content.
 *
 * Features:
 * - Shows workout title, discipline, duration, intensity
 * - Expandable "Why" explanation
 * - Completion tracking
 * - First-time workout highlighting
 *
 * @param workout - Workout data from database
 * @param onComplete - Callback when workout is completed (optional)
 * @param showEducation - Whether to show educational content (default: false)
 * @param disabled - Disables interaction (optional)
 */
export function WorkoutCard({ ... }: Props) {
  // ...
}
```

---

## API Route Patterns

### Standard Structure

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 1. Input validation schema
const createWorkoutFeedbackSchema = z.object({
  feeling: z.number().int().min(1).max(5),
  perceivedDifficulty: z.number().int().min(1).max(10),
  notes: z.string().max(1000).optional(),
})

// 2. GET handler
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 2a. Auth check (always first)
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2b. Parse query params
    const { searchParams } = new URL(req.url)
    const completed = searchParams.get('completed') === 'true'

    // 2c. Database query
    const workouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
        ...(completed !== undefined && { completed }),
      },
      orderBy: { date: 'desc' },
    })

    // 2d. Return response
    return NextResponse.json({ workouts })

  } catch (error) {
    // 2e. Error handling
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 3. POST handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 3a. Auth check
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3b. Parse and validate body
    const body = await req.json()
    const validatedData = createWorkoutFeedbackSchema.parse(body)

    // 3c. Business logic / database mutation
    const feedback = await prisma.workoutFeedback.create({
      data: {
        userId: session.user.id,
        workoutId: body.workoutId,
        feeling: validatedData.feeling,
        perceivedDifficulty: validatedData.perceivedDifficulty,
        notes: validatedData.notes,
      },
    })

    // 3d. Return created resource
    return NextResponse.json(feedback, { status: 201 })

  } catch (error) {
    // 3e. Error handling with type checking
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Server Actions Pattern (Next.js 15)

**Prefer Server Actions for mutations:**

```typescript
// app/actions/workouts.ts
'use server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function completeWorkout(workoutId: string) {
  const user = await requireAuth()

  try {
    await prisma.workout.update({
      where: { id: workoutId, userId: user.id },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    })

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error completing workout:', error)
    return { success: false, error: 'Failed to complete workout' }
  }
}
```

**Use in Client Component:**

```typescript
'use client'

import { completeWorkout } from '@/app/actions/workouts'

export function CompleteButton({ workoutId }: Props) {
  async function handleClick() {
    const result = await completeWorkout(workoutId)
    if (result.success) {
      toast.success('Workout completed!')
    }
  }

  return <Button onClick={handleClick}>Complete</Button>
}
```

---

## Database Patterns (Prisma)

### Query Patterns

**Simple query:**
```typescript
const workout = await prisma.workout.findUnique({
  where: { id: workoutId }
})
```

**Query with relations:**
```typescript
const plan = await prisma.trainingPlan.findUnique({
  where: { id: planId },
  include: {
    workouts: true,
    user: {
      include: {
        athleteProfile: true,
      },
    },
  },
})
```

**Query with multiple conditions:**
```typescript
const workouts = await prisma.workout.findMany({
  where: {
    userId,
    discipline: 'RUN',
    completed: true,
    date: {
      gte: startDate,
      lte: endDate,
    },
  },
  orderBy: [
    { date: 'desc' },
    { createdAt: 'desc' },
  ],
  take: 20,
  skip: page * 20,
})
```

### Insert Patterns

**Single insert:**
```typescript
const workout = await prisma.workout.create({
  data: {
    userId: user.id,
    planId,
    discipline: 'RUN',
    type: 'EASY',
    title: 'Easy Run',
    description: '40 minutes easy pace',
    durationMin: 40,
    intensityZone: 'Z2',
    explanation: 'Builds aerobic base',
    date: new Date(),
  },
})
```

**Batch insert:**
```typescript
await prisma.workout.createMany({
  data: workouts.map(w => ({
    userId,
    planId,
    ...w,
  })),
})
```

### Update Patterns

**Simple update:**
```typescript
await prisma.workout.update({
  where: { id: workoutId },
  data: {
    completed: true,
    completedAt: new Date(),
  },
})
```

**Update with relations:**
```typescript
await prisma.athleteProfile.update({
  where: { userId },
  data: {
    learnedPreferences: {
      ...profile.learnedPreferences,
      'recovery-needs-48h': {
        confidence: 0.9,
        dataPoints: 5,
      },
    },
  },
})
```

### Type Safety

**Use Prisma generated types:**

```typescript
import type { Workout, TrainingPlan, Prisma } from '@prisma/client'

// For includes/relations
type WorkoutWithFeedback = Prisma.WorkoutGetPayload<{
  include: { feedback: true }
}>

// For partial data
type WorkoutCreateInput = Prisma.WorkoutCreateInput
```

---

## AI/LLM Patterns (Anthropic Claude)

### Standard AI Call Pattern

```typescript
import { anthropic } from '@/lib/ai/client'
import { z } from 'zod'

const ResponseSchema = z.object({
  // Define expected structure
})

export async function generateContent(prompt: string) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0.3,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }, // Enable prompt caching
        },
      ],
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI')
    }

    const parsed = JSON.parse(textContent.text)
    return ResponseSchema.parse(parsed)
  } catch (error) {
    console.error('AI call failed:', error)
    throw error
  }
}
```

### Model Selection

```typescript
export function selectModel(complexity: 'simple' | 'complex'): string {
  return complexity === 'simple'
    ? 'claude-haiku-4-20250514'  // Cheap, fast
    : 'claude-sonnet-4-20250514' // Smart, accurate
}
```

### Prompt Engineering Standards

**Reference Training Knowledge:**
```typescript
import { loadTrainwikiDocs } from '@/lib/ai/trainwiki-loader'

const trainingKnowledge = await loadTrainwikiDocs([
  'core/periodization.md',
  'core/80-20-rule.md',
])

const systemPrompt = `You are an expert coach.

Training Science:
${trainingKnowledge}

...
`
```

### Cost Tracking

**Always track AI costs:**

```typescript
export async function trackAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<number> {
  const costs = {
    'claude-haiku-4-20250514': { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 },
    'claude-sonnet-4-20250514': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  }

  const modelCosts = costs[model as keyof typeof costs]
  const cost = (inputTokens * modelCosts.input) + (outputTokens * modelCosts.output)

  console.log(`AI Cost: $${cost.toFixed(4)} - ${model}`)

  return cost
}
```

---

## Error Handling

### Try-Catch Blocks

**Wrap risky operations:**

```typescript
export async function processWorkout(data: unknown) {
  try {
    const validated = WorkoutSchema.parse(data)
    const result = await saveWorkout(validated)
    return result
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.message}`)
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(`Database error: ${error.message}`)
    }
    throw error // Re-throw unknown errors
  }
}
```

### Error Logging

**Log errors with context:**

```typescript
try {
  // ... operation
} catch (error) {
  console.error('Error generating plan:', {
    userId: user.id,
    goalType: profile.goalType,
    error: error instanceof Error ? error.message : String(error),
  })
  throw error
}
```

**Never log:**
- Passwords
- API keys (ANTHROPIC_API_KEY)
- Session tokens
- Any PII unnecessarily

---

## Testing

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest'
import { validatePlan } from '@/lib/ai/plan-validator'

describe('Plan Validator', () => {
  it('detects 80/20 rule violation', () => {
    const plan = createTestPlan({
      week1: [
        { intensityZone: 'Z4' },
        { intensityZone: 'Z5' },
        { intensityZone: 'Z4' },
        { intensityZone: 'Z2' },
      ],
    })

    const warnings = validatePlan(plan)

    expect(warnings).toContain('80/20 rule violated')
  })

  it('accepts valid plan', () => {
    const plan = createValidPlan()
    const warnings = validatePlan(plan)

    expect(warnings).toHaveLength(0)
  })
})
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/workouts/[id]/feedback/route'

describe('POST /api/workouts/:id/feedback', () => {
  it('creates feedback and marks workout complete', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        feeling: 4,
        perceivedDifficulty: 7,
        notes: 'Great workout!',
      },
    })

    const res = await POST(req, { params: { id: 'workout-id' } })
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.feeling).toBe(4)
  })
})
```

---

## Comments

### When to Comment

**Comment WHY, not WHAT:**

```typescript
// ❌ Bad: Obvious comment
// Set the workout completed
workout.completed = true

// ✅ Good: Explains reasoning
// Mark completed before analyzing feedback because the analysis
// depends on completion timestamp for streak calculation
await prisma.workout.update({
  where: { id: workoutId },
  data: { completed: true, completedAt: new Date() },
})

await analyzeFeedback(userId, feedbackId)
```

**Complex logic needs comments:**

```typescript
// ✅ Good: Explains non-obvious logic
// Build system prompt in specific order to optimize AI performance.
// Training knowledge must come first (cache-able), then athlete
// context (changes per user), then specific constraints (changes often).
const systemPrompt = [
  trainingKnowledge,    // Cached
  athleteContext,       // User-specific
  activeConstraints,    // Dynamic
]
  .filter(Boolean)
  .join('\n\n---\n\n')
```

### JSDoc for Public Functions

```typescript
/**
 * Generates a 2-week training plan using AI.
 *
 * Uses Claude Sonnet with cached training knowledge from trainwiki.
 * Validates output with multi-layer checks (80/20 rule, progression, etc.)
 *
 * @param userId - User ID to generate plan for
 * @returns Generated and validated training plan
 * @throws {Error} If user has no athlete profile or AI generation fails
 *
 * @example
 * ```ts
 * const plan = await generateTrainingPlan('user-123')
 * console.log(plan.week1.length) // 7 workouts
 * ```
 */
export async function generateTrainingPlan(
  userId: string
): Promise<TrainingPlan> {
  // ...
}
```

---

## Performance Best Practices

### Database

**1. Use indexes (defined in schema.prisma):**
```prisma
model Workout {
  @@index([userId, date])
  @@index([userId, completed])
}
```

**2. Select only needed fields:**
```typescript
const workouts = await prisma.workout.findMany({
  select: {
    id: true,
    title: true,
    date: true,
    completed: true,
  },
})
```

**3. Implement pagination:**
```typescript
const workouts = await prisma.workout.findMany({
  take: 20,
  skip: page * 20,
})
```

### AI Optimization

**1. Prompt caching:**
```typescript
system: [
  {
    type: 'text',
    text: expensivePrompt,
    cache_control: { type: 'ephemeral' },
  },
],
```

**2. Model selection:**
```typescript
// Use Haiku for simple tasks
model: selectModel('simple') // For insights, parsing

// Use Sonnet for complex reasoning
model: selectModel('complex') // For plan generation
```

---

## Security Best Practices

### Input Validation

**Always validate with Zod:**

```typescript
import { z } from 'zod'

const WorkoutFeedbackSchema = z.object({
  feeling: z.number().int().min(1).max(5),
  perceivedDifficulty: z.number().int().min(1).max(10),
  notes: z.string().max(1000).optional(),
})

const validated = WorkoutFeedbackSchema.parse(userInput)
```

### Authentication

**Check auth on every protected endpoint:**

```typescript
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ...
}
```

**Or use helper:**

```typescript
import { requireAuth } from '@/lib/auth-helpers'

export default async function DashboardPage() {
  const user = await requireAuth() // Redirects if not logged in
  // ...
}
```

---

## Git Commit Conventions

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Build process, dependencies, etc.

**Examples:**

```bash
feat(ai): implement plan generation engine

Add complete AI-powered plan generation with:
- Multi-layer validation (80/20, progression)
- Prompt caching for cost optimization
- Zod schema validation

Implements buildwiki/phase-2-ai-core.md milestone 2.1

---

fix(auth): handle missing session in dashboard

Check for session before accessing user data.
Redirect to /login if session is null.

Fixes #123
```

---

## Documentation References

When implementing features, always reference:

**BuildWiki:**
- `buildwiki/phase-N-*.md` - Implementation tasks

**TechWiki:**
- `techwiki/01-architecture/` - System design
- `techwiki/02-database/` - Database schema
- `techwiki/03-ai-engines/` - AI implementation details

**TrainWiki:**
- Load via `loadTrainwikiDocs()` in AI prompts
- Reference in comments when using training science

**DesignWiki:**
- Follow UI/UX patterns from examples
- Match color schemes and spacing

---

## Summary

### Do's ✅

- Follow Next.js 15 App Router patterns
- Use TypeScript strict mode
- Validate all input with Zod
- Check auth on every protected endpoint
- Use Server Components by default
- Reference trainwiki in AI prompts
- Enable prompt caching for AI calls
- Track AI costs
- Comment WHY, not WHAT
- Write explicit return types
- Handle errors properly
- Use async/await (not .then())

### Don'ts ❌

- Use `any` types
- Skip input validation
- Forget auth checks
- Use `.then()` chains
- Skip error handling
- Hardcode training knowledge (use trainwiki)
- Ignore AI costs
- Commit console.logs
- Use Client Components unnecessarily
- Make huge commits

---

**These standards ensure:**
- Consistent, maintainable codebase
- Type safety at every level
- Security by default
- Optimized AI costs
- Fast development velocity
- Easy code review

**Next Steps:** Reference `buildwiki/phase-1-foundation.md` to start implementation.

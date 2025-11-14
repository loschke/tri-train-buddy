# Testing Strategy

## Overview

Comprehensive testing strategy für Tri-Train-Buddy v2.0 covering Unit Tests, Integration Tests, E2E Tests, and Manual Testing.

**Testing Philosophy:**
1. **Test What Matters** - Focus on critical user journeys
2. **Fast Feedback** - Run most tests locally
3. **Confidence over Coverage** - 80% coverage with confidence > 100% without
4. **Test in Production** - Use feature flags and monitoring

---

## Testing Pyramid

```
         /\
        /E2E\ ← Few (5-10 critical flows)
       /------\
      /Integration\ ← Some (20-30 key paths)
     /-------------\
    /  Unit Tests   \ ← Many (100+ functions)
   /-----------------\
```

---

## 1. Unit Tests

### Tools

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
    },
  },
})
```

### What to Test

#### AI Utilities

```typescript
// tests/ai/constraint-parser.test.ts

import { describe, it, expect } from 'vitest'
import { parseConstraint } from '@/lib/ai/constraint-parser'

describe('Constraint Parser', () => {
  it('should parse simple travel constraint', async () => {
    const result = await parseConstraint(
      'Nächste Woche Dienstreise München 18.-20. Nov'
    )

    expect(result.parsed.dateRanges).toHaveLength(1)
    expect(result.parsed.dateRanges[0].type).toBe('travel')
    expect(result.parsed.dateRanges[0].location).toBe('München')
  })

  it('should detect need for clarification', async () => {
    const result = await parseConstraint('Nächste Woche unterwegs')

    expect(result.needsClarification).toBe(true)
    expect(result.clarifyingQuestions).toBeTruthy()
  })

  it('should handle injury constraints', async () => {
    const result = await parseConstraint(
      'Knie tut weh, lieber kein Laufen diese Woche'
    )

    expect(result.parsed.dateRanges[0].type).toBe('injury')
    expect(result.parsed.dateRanges[0].impact).toBe('block')
  })
})
```

#### Plan Validation

```typescript
// tests/ai/plan-validator.test.ts

import { describe, it, expect } from 'vitest'
import { validatePlan } from '@/lib/ai/plan-generator'

describe('Plan Validation', () => {
  it('should detect 80/20 rule violation', () => {
    const plan = {
      week1: [
        { intensityZone: 'Z4' }, // Too many hard
        { intensityZone: 'Z5' },
        { intensityZone: 'Z4' },
        { intensityZone: 'Z2' },
        { intensityZone: 'Z3' },
        { intensityZone: 'Z1' },
        { type: 'REST' },
      ],
      week2: [...],
      rationale: 'Test',
      phase: 'BASE',
      weeklyVolume: { week1: 300, week2: 320 },
      keyWorkouts: [],
    }

    const warnings = validatePlan(plan, mockContext)

    expect(warnings).toContain('80/20 rule violated')
  })

  it('should detect back-to-back hard days', () => {
    const plan = createPlanWithBackToBackHard()
    const warnings = validatePlan(plan, mockContext)

    expect(warnings).toContain('back-to-back hard days')
  })

  it('should accept valid plan', () => {
    const plan = createValidPlan()
    const warnings = validatePlan(plan, mockContext)

    expect(warnings).toHaveLength(0)
  })
})
```

#### Gamification Logic

```typescript
// tests/gamification/streak.test.ts

import { describe, it, expect } from 'vitest'
import { calculateStreak } from '@/lib/gamification/achievement-engine'

describe('Streak Calculation', () => {
  it('should calculate correct streak', async () => {
    const workouts = [
      { date: new Date('2024-11-14'), completed: true },
      { date: new Date('2024-11-13'), completed: true },
      { date: new Date('2024-11-12'), completed: true },
      // Missing 11th - streak breaks
      { date: new Date('2024-11-10'), completed: true },
    ]

    const streak = calculateStreakFromWorkouts(workouts)

    expect(streak).toBe(3) // Last 3 consecutive days
  })

  it('should handle no workouts', async () => {
    const streak = calculateStreakFromWorkouts([])
    expect(streak).toBe(0)
  })
})
```

### Run Unit Tests

```bash
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # With coverage
```

**Target:** > 80% coverage on business logic

---

## 2. Integration Tests

### What to Test

#### API Routes

```typescript
// tests/api/workouts/feedback.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from '@/app/api/workouts/[id]/feedback/route'
import { createMockRequest, createTestUser, createTestWorkout } from '@/tests/helpers'

describe('POST /api/workouts/:id/feedback', () => {
  let user: any
  let workout: any

  beforeEach(async () => {
    user = await createTestUser()
    workout = await createTestWorkout({ userId: user.id })
  })

  it('should save feedback and mark workout complete', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        feeling: 4,
        perceivedDifficulty: 7,
        notes: 'Great workout!',
      },
      headers: { authorization: `Bearer ${user.token}` },
    })

    const response = await POST(req, { params: { id: workout.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify in database
    const updatedWorkout = await prisma.workout.findUnique({
      where: { id: workout.id },
    })
    expect(updatedWorkout?.completed).toBe(true)
  })

  it('should return 404 for non-existent workout', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { feeling: 4, perceivedDifficulty: 7 },
      headers: { authorization: `Bearer ${user.token}` },
    })

    const response = await POST(req, { params: { id: 'nonexistent' } })

    expect(response.status).toBe(404)
  })

  it('should return 401 for unauthorized', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { feeling: 4, perceivedDifficulty: 7 },
    })

    const response = await POST(req, { params: { id: workout.id } })

    expect(response.status).toBe(401)
  })
})
```

#### Server Actions

```typescript
// tests/actions/plans.test.ts

import { describe, it, expect } from 'vitest'
import { createNewPlan } from '@/app/actions/plans'
import { createAuthenticatedUser } from '@/tests/helpers'

describe('createNewPlan Server Action', () => {
  it('should create a training plan', async () => {
    const user = await createAuthenticatedUser({
      athleteProfile: {
        goal: 'Hamburg Marathon 2026',
        goalType: 'MARATHON',
        goalDate: new Date('2026-04-26'),
      },
    })

    const result = await createNewPlan()

    expect(result.success).toBe(true)
    expect(result.planId).toBeTruthy()

    // Verify plan in database
    const plan = await prisma.trainingPlan.findUnique({
      where: { id: result.planId },
      include: { workouts: true },
    })

    expect(plan).toBeTruthy()
    expect(plan?.workouts).toHaveLength(14)
  })
})
```

### Test Helpers

```typescript
// tests/helpers.ts

import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'

export async function createTestUser(data?: Partial<User>) {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      password: await hash('password123', 10),
      ...data,
    },
  })
}

export async function createTestWorkout(data: any) {
  return prisma.workout.create({
    data: {
      title: 'Test Workout',
      discipline: 'RUN',
      type: 'EASY',
      description: 'Test',
      durationMin: 40,
      explanation: 'Test',
      date: new Date(),
      ...data,
    },
  })
}

export function createMockRequest(options: any) {
  return new Request('http://localhost:3000', {
    method: options.method || 'GET',
    headers: new Headers(options.headers || {}),
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}
```

---

## 3. E2E Tests

### Tools

```bash
npm install -D @playwright/test
npx playwright install
```

### Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Critical User Journeys

#### Journey 1: Complete Onboarding

```typescript
// tests/e2e/onboarding.spec.ts

import { test, expect } from '@playwright/test'

test('complete onboarding flow', async ({ page }) => {
  // 1. Start onboarding
  await page.goto('/onboarding/chat')

  // 2. Enter goal
  await page.fill('textarea', 'Ich möchte im April 2026 den Hamburg Marathon laufen')
  await page.click('button:has-text("Senden")')

  // 3. Wait for AI response
  await expect(page.locator('text=aktuelles Level')).toBeVisible({ timeout: 10000 })

  // 4. Enter current level
  await page.fill('textarea', 'Ich laufe 3x die Woche so 10km')
  await page.click('button:has-text("Senden")')

  // 5. Continue through availability, injury history
  // ... more steps ...

  // 6. Confirm
  await page.click('button:has-text("Ja")')

  // 7. Verify redirect to plan generation
  await expect(page).toHaveURL('/onboarding/generating')
})
```

#### Journey 2: Complete Workout & Feedback

```typescript
// tests/e2e/workout-flow.spec.ts

import { test, expect } from '@playwright/test'

test('complete workout and give feedback', async ({ page }) => {
  // Login as test user
  await loginAsTestUser(page)

  // Navigate to dashboard
  await page.goto('/dashboard')

  // Click on today's workout
  await page.click('text=Training starten')

  // Verify workout details
  await expect(page.locator('h1')).toContainText('Easy Run')

  // Complete workout
  await page.click('button:has-text("Als erledigt markieren")')

  // Give feedback
  await page.click('[data-testid="feeling-4"]') // 😎
  await page.fill('[data-testid="difficulty-slider"]', '6')
  await page.fill('textarea', 'Lief gut!')
  await page.click('button:has-text("Feedback speichern")')

  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard')

  // Verify achievement toast (if first workout)
  await expect(page.locator('text=Achievement unlocked')).toBeVisible()
})
```

### Run E2E Tests

```bash
npx playwright test                    # Run all E2E tests
npx playwright test --ui               # UI mode
npx playwright test --debug            # Debug mode
npx playwright show-report             # View report
```

**Target:** 5-10 critical journeys covered

---

## 4. Manual Testing

### Test Matrix

| Feature | Chrome | Safari | Firefox | Mobile |
|---------|--------|--------|---------|--------|
| Signup | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ | ✅ |
| Onboarding | ✅ | ✅ | ✅ | ⚠️ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Plan Gen | ✅ | ⏳ | ⏳ | ⏳ |
| Workout | ✅ | ⏳ | ⏳ | ⏳ |
| Feedback | ✅ | ⏳ | ⏳ | ⏳ |

Legend: ✅ Pass | ❌ Fail | ⚠️ Issue | ⏳ Not Tested

### Exploratory Testing Checklist

**Onboarding:**
- [ ] Can complete with minimal input
- [ ] Can complete with detailed input
- [ ] Handles ambiguous answers (clarifies)
- [ ] Saves data correctly
- [ ] Redirects to dashboard

**Plan Generation:**
- [ ] Plan generates < 15 seconds
- [ ] Plan passes all validations
- [ ] Rationale makes sense
- [ ] Workouts realistic
- [ ] Educational content helpful

**Workout Flow:**
- [ ] Can view workout details
- [ ] Can complete workout
- [ ] Can skip workout
- [ ] Feedback saves correctly
- [ ] Achievements unlock

**Dashboard:**
- [ ] Shows correct data
- [ ] Insights relevant
- [ ] Streak calculation correct
- [ ] Weekly overview accurate
- [ ] Performance < 2 seconds

**Mobile:**
- [ ] All pages responsive
- [ ] Touch targets large enough
- [ ] No horizontal scroll
- [ ] Forms usable
- [ ] Readable fonts

---

## 5. Performance Testing

### Lighthouse Audit

```bash
npm install -g lighthouse

lighthouse https://your-app.vercel.app --view
```

**Targets:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### Load Testing

```bash
npm install -g artillery

# Create load-test.yml
artillery quick --count 50 --num 5 https://your-app.vercel.app/api/plans/generate
```

**Targets:**
- 95th percentile response time < 2s
- Error rate < 1%
- Can handle 50 concurrent users

---

## 6. Security Testing

### Checklist

- [ ] SQL Injection - Test with malicious input in all forms
- [ ] XSS - Test with `<script>alert('xss')</script>`
- [ ] CSRF - Test without proper headers
- [ ] Authentication - Test without login
- [ ] Authorization - Test accessing other user's data
- [ ] Rate Limiting - Test exceeding limits

### Tools

```bash
# OWASP ZAP (optional)
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://your-app.vercel.app
```

---

## 7. CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Test

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Testing Schedule

### Daily (During Development)
- Run unit tests before commit
- Run integration tests for changed features
- Manual testing of new features

### Before Each PR
- Full unit test suite
- Integration tests for affected areas
- E2E tests for critical paths
- Lighthouse audit

### Before Production Deploy
- Full test suite (unit + integration + E2E)
- Manual exploratory testing
- Load testing
- Security audit
- Performance benchmarks

### After Production Deploy
- Smoke tests
- Monitor error rates
- Check performance metrics

---

## Test Data Management

### Seed Data

Create `prisma/seed.ts`:

```typescript
async function main() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
    },
  })

  // Create athlete profile
  await prisma.athleteProfile.create({
    data: {
      userId: user.id,
      goal: 'Hamburg Marathon 2026',
      goalType: 'MARATHON',
      goalDate: new Date('2026-04-26'),
      currentLevel: { experience: 'intermediate' },
      availability: { mornings: ['Mon', 'Wed', 'Fri'] },
      riskProfile: 'MODERATE',
      onboardingCompleted: true,
    },
  })
}

main()
```

Run: `npx prisma db seed`

---

## Summary

**Testing Coverage Goals:**
- Unit Tests: 80%+ on business logic
- Integration Tests: All API routes and Server Actions
- E2E Tests: 5-10 critical user journeys
- Manual Tests: All features on 3+ browsers
- Performance: Lighthouse > 90 across board

**Estimated Testing Time per Phase:**
- Phase 1: 4 hours
- Phase 2: 8 hours
- Phase 3: 12 hours
- Phase 4: 6 hours
- Phase 5: 8 hours

**Total: ~40 hours testing** (across all phases)

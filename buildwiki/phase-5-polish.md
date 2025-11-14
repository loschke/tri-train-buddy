# Phase 5: Polish & Production Ready

## Ziel
Production-ready Platform mit Performance Optimization, Error Handling, Mobile Support, und Security Hardening.

**Duration:** 1-2 Wochen
**Effort:** ~40-60 Stunden
**Risk Level:** 🟡 Medium (Production Issues)

---

## Voraussetzungen

- ✅ Phase 1-4 erfolgreich abgeschlossen
- ✅ Alle Core Features funktionieren
- ✅ User Testing durchgeführt

---

## Phase Milestones

### Milestone 5.1: Performance Optimization (Tag 1-3)
**Ziel:** <2s Ladezeiten, optimierte AI Costs

### Milestone 5.2: Error Handling & Monitoring (Tag 4-5)
**Ziel:** Production-grade Error Handling, Sentry Setup

### Milestone 5.3: Mobile Optimization (Tag 6-7)
**Ziel:** Responsive Design funktioniert überall

### Milestone 5.4: Security Hardening (Tag 8-9)
**Ziel:** Security Checklist completed

### Milestone 5.5: Documentation & Launch Prep (Tag 10-12)
**Ziel:** Docs finalisiert, Launch-Ready

---

## Milestone 5.1: Performance Optimization

### Tasks

#### 5.1.1 Database Query Optimization
**Estimated Time:** 2 hours

Add missing indexes:

```prisma
// prisma/schema.prisma

model Workout {
  // ... existing fields ...

  @@index([userId, date]) // Composite index for dashboard queries
  @@index([planId, completed])
  @@index([userId, completed, date])
}

model WorkoutFeedback {
  // ... existing fields ...

  @@index([userId, createdAt])
  @@index([analyzed, createdAt])
}

model AthletePreference {
  // ... existing fields ...

  @@index([userId, active, confidence])
}
```

Run migration:
```bash
npx prisma migrate dev --name add_performance_indexes
```

**Verification:**
- [ ] Queries faster (check Prisma logs)
- [ ] Dashboard loads < 1s

---

#### 5.1.2 Implement React Server Components Caching
**Estimated Time:** 1.5 hours

Add caching to expensive operations:

```typescript
// app/dashboard/page.tsx
import { unstable_cache } from 'next/cache'

const getCachedInsight = unstable_cache(
  async (userId: string) => {
    return generateDailyInsight(userId)
  },
  ['daily-insight'],
  {
    revalidate: 3600, // 1 hour
    tags: ['user-insights'],
  }
)

export default async function DashboardPage() {
  // ... auth ...

  const insight = await getCachedInsight(user.id)
  // ...
}
```

**Verification:**
- [ ] Insights cached for 1 hour
- [ ] Second load instant

---

#### 5.1.3 Optimize AI Costs
**Estimated Time:** 2 hours

Implement aggressive prompt caching:

```typescript
// app/lib/ai/plan-generator.ts

// Load trainwiki ONCE per deploy, cache in memory
let TRAINWIKI_CACHE: Map<string, string> = new Map()

async function getCachedTrainwiki(files: string[]): Promise<string> {
  const cacheKey = files.sort().join(',')

  if (TRAINWIKI_CACHE.has(cacheKey)) {
    return TRAINWIKI_CACHE.get(cacheKey)!
  }

  const content = await loadTrainwikiDocs(files)
  TRAINWIKI_CACHE.set(cacheKey, content)

  return content
}

// Use Haiku for simple tasks
async function generateSimpleInsight(data: any) {
  return anthropic.messages.create({
    model: 'claude-haiku-4-20250514', // Cheaper model
    max_tokens: 256,
    // ...
  })
}
```

**Target Cost Reduction:** 60-70% vs Phase 2

**Verification:**
- [ ] Track costs for 24h
- [ ] < $0.30 per plan
- [ ] < $0.05 per insight

---

#### 5.1.4 Image Optimization
**Estimated Time:** 1 hour

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    minimumCacheTTL: 60,
  },
  // Enable experimental features
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig
```

**Verification:**
- [ ] Lighthouse Performance > 90

---

## Milestone 5.2: Error Handling & Monitoring

### Tasks

#### 5.2.1 Setup Sentry
**Estimated Time:** 1 hour

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configure `sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/tri-train-buddy\.vercel\.app/],
    }),
  ],
})
```

**Verification:**
- [ ] Sentry receives events
- [ ] Errors tracked

---

#### 5.2.2 Implement Global Error Boundaries
**Estimated Time:** 1.5 hours

Erstelle `app/error.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Etwas ist schiefgelaufen</h2>
        <p className="text-gray-600 mb-6">
          Wir wurden benachrichtigt und kümmern uns darum.
        </p>
        <Button onClick={() => reset()}>Nochmal versuchen</Button>
      </div>
    </div>
  )
}
```

**Verification:**
- [ ] Error boundary catches errors
- [ ] User sees friendly message
- [ ] Can retry

---

#### 5.2.3 Add API Error Logging
**Estimated Time:** 45 min

Create error logger:

```typescript
// app/lib/logger.ts

import * as Sentry from '@sentry/nextjs'

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, meta, timestamp: new Date() }))
  },

  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.message, meta, timestamp: new Date() }))

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, { extra: meta })
    }
  },

  warn: (message: string, meta?: any) => {
    console.warn(JSON.stringify({ level: 'warn', message, meta, timestamp: new Date() }))
  },
}
```

Use in API routes:

```typescript
try {
  // ... operation ...
} catch (error) {
  logger.error('Plan generation failed', error as Error, { userId })
  throw error
}
```

**Verification:**
- [ ] Errors logged to Sentry
- [ ] Structured logging in Vercel logs

---

## Milestone 5.3: Mobile Optimization

### Tasks

#### 5.3.1 Mobile-First CSS Audit
**Estimated Time:** 3 hours

Review all pages for mobile:
- [ ] Dashboard responsive
- [ ] Onboarding chat mobile-friendly
- [ ] Workout details readable
- [ ] Feedback form usable
- [ ] Achievements page works

Fix common issues:
- Overflow text
- Touch targets < 44px
- Horizontal scrolling
- Font sizes too small

**Verification:**
- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPad (tablet)
- [ ] Lighthouse Mobile Score > 85

---

#### 5.3.2 Add PWA Support (Optional)
**Estimated Time:** 2 hours

Install next-pwa:

```bash
npm install next-pwa
```

Update `next.config.js`:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA(nextConfig)
```

Create `public/manifest.json`:

```json
{
  "name": "Tri-Train-Buddy",
  "short_name": "TTB",
  "description": "Your personal AI training coach",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

**Verification:**
- [ ] Can install as PWA
- [ ] Works offline (basic pages)

---

## Milestone 5.4: Security Hardening

### Tasks

#### 5.4.1 Security Checklist
**Estimated Time:** 2 hours

- [ ] All env vars in Vercel (not in code)
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Database SSL required (Neon default)
- [ ] Authentication on all API routes
- [ ] Input validation with Zod everywhere
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (React auto-escaping)
- [ ] CSRF protection (SameSite cookies)
- [ ] Rate limiting on public endpoints
- [ ] No secrets in client-side code
- [ ] CORS configured correctly
- [ ] File upload validation (if applicable)

---

#### 5.4.2 Add Rate Limiting (Optional - requires Upstash)
**Estimated Time:** 1.5 hours

```bash
npm install @upstash/ratelimit @upstash/redis
```

Create rate limiter:

```typescript
// app/lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 10 requests per 10 seconds per IP
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})
```

Use in API routes:

```typescript
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await rateLimiter.limit(ip)

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // ... handle request ...
}
```

**Verification:**
- [ ] Rate limiting works
- [ ] 429 response after limit

---

## Milestone 5.5: Documentation & Launch Prep

### Tasks

#### 5.5.1 Update Documentation
**Estimated Time:** 2 hours

- [ ] README.md updated with setup instructions
- [ ] CHANGELOG.md created
- [ ] API docs updated (if needed)
- [ ] User guide written
- [ ] Privacy Policy & Terms of Service

---

#### 5.5.2 Pre-Launch Checklist
**Estimated Time:** 3 hours

**Technical:**
- [ ] All tests passing
- [ ] No console errors
- [ ] Lighthouse scores > 90
- [ ] SEO meta tags configured
- [ ] Favicon & app icons
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Error monitoring working
- [ ] Analytics configured

**Content:**
- [ ] Landing page complete
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email configured
- [ ] robots.txt configured
- [ ] sitemap.xml generated

**Business:**
- [ ] Pricing decided
- [ ] Billing integrated (if needed)
- [ ] Email sending configured
- [ ] Backup strategy documented
- [ ] Incident response plan

---

#### 5.5.3 Load Testing
**Estimated Time:** 2 hours

Test with simulated load:

```bash
# Using artillery or k6
npm install -g artillery

# Create load-test.yml
artillery quick --count 100 --num 10 https://your-app.vercel.app
```

**Monitor:**
- Response times
- Error rates
- Database connections
- AI API costs

**Verification:**
- [ ] Can handle 100 concurrent users
- [ ] No timeouts
- [ ] Errors < 1%

---

## Success Criteria

Phase 5 ist **erfolgreich abgeschlossen**, wenn:

- ✅ Lighthouse Performance > 90
- ✅ Mobile Optimization complete
- ✅ Error monitoring active
- ✅ Security checklist completed
- ✅ Load tests passing
- ✅ Documentation updated
- ✅ Ready for production launch

---

## Launch!

### Go-Live Steps

1. **Final Production Deploy**
```bash
git tag v2.0.0
git push --tags
vercel --prod
```

2. **Smoke Tests**
- [ ] Can register
- [ ] Can complete onboarding
- [ ] Plan generates
- [ ] Can complete workout
- [ ] Dashboard loads

3. **Monitor First 24h**
- [ ] Error rates
- [ ] Performance metrics
- [ ] User signups
- [ ] AI costs
- [ ] Database load

4. **Have Rollback Ready**
```bash
vercel rollback
```

---

## Post-Launch

### Week 1 Tasks

- [ ] Monitor error logs daily
- [ ] Track key metrics
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Plan first iteration

### Week 2-4 Tasks

- [ ] Analyze user behavior
- [ ] Optimize based on data
- [ ] Plan feature enhancements
- [ ] Marketing & growth

---

**Estimated Total Time:** 40-60 hours
**Critical Path:** Performance → Security → Testing → Launch
**Biggest Risk:** Production issues
**Mitigation:** Comprehensive testing, monitoring, rollback plan

---

**🎉 Congratulations! You've built Tri-Train-Buddy v2.0!**

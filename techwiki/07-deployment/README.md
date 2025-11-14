# Deployment Strategy

## Overview

Tri-Train-Buddy is deployed on **Vercel** with managed services for database, authentication, and storage. This architecture prioritizes:
1. **Simplicity** - Minimal infrastructure management
2. **Scalability** - Automatic scaling with demand
3. **Cost-Effectiveness** - Pay for what you use
4. **Developer Experience** - Fast deployments, preview environments

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           Vercel (Frontend + API)           │
│                                             │
│  ┌───────────┐  ┌───────────┐  ┌─────────┐│
│  │  Next.js  │→│Server      │→│ Edge     ││
│  │  App      │ │Actions     │ │ Functions││
│  └───────────┘  └───────────┘  └─────────┘│
└─────────────────────────────────────────────┘
         ↓              ↓              ↓
┌────────────┐  ┌──────────────┐  ┌──────────┐
│ Neon       │  │ Anthropic    │  │ Upstash  │
│ PostgreSQL │  │ Claude API   │  │ Redis    │
│ (Database) │  │ (AI)         │  │ (Cache)  │
└────────────┘  └──────────────┘  └──────────┘

         ↓
┌────────────┐
│ Vercel     │
│ Blob       │
│ (Files)    │
└────────────┘
```

---

## 1. Vercel Configuration

### Project Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy
vercel --prod
```

### vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "regions": ["fra1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "BETTER_AUTH_SECRET": "@auth-secret",
    "BETTER_AUTH_URL": "@auth-url"
  },
  "framework": "nextjs",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=1, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

---

## 2. Database (Neon)

### Why Neon?

- ✅ **Serverless PostgreSQL** - Auto-scaling, pay-per-use
- ✅ **Branching** - Git-like branches for development
- ✅ **Connection Pooling** - Built-in with PgBouncer
- ✅ **Auto-Suspend** - Pause when not in use
- ✅ **Free Tier** - Generous limits for MVP

### Configuration

```typescript
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // For migrations
}
```

### Environment Variables

```bash
# .env.production
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Branching Strategy

```bash
# Create branch for feature development
neonctl branches create --name feature/new-dashboard

# Use branch URL in development
DATABASE_URL="postgresql://...@ep-feature-xxx.neon.tech/neondb"

# Run migrations on branch
npx prisma migrate dev

# Merge to main when ready
neonctl branches merge feature/new-dashboard --into main
```

---

## 3. Caching (Upstash Redis)

### Why Upstash?

- ✅ **Serverless Redis** - No connection limits
- ✅ **REST API** - Works in edge environments
- ✅ **Free Tier** - 10k commands/day
- ✅ **Global Replication** - Low latency worldwide

### Configuration

```typescript
// File: app/lib/redis.ts

import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache onboarding state
export async function cacheOnboardingState(
  userId: string,
  state: any
): Promise<void> {
  await redis.set(`onboarding:${userId}`, state, {
    ex: 3600, // Expire after 1 hour
  })
}

export async function getOnboardingState(userId: string): Promise<any | null> {
  return redis.get(`onboarding:${userId}`)
}
```

---

## 4. File Storage (Vercel Blob)

### Why Vercel Blob?

- ✅ **Integrated** - Works seamlessly with Vercel
- ✅ **CDN** - Global edge network
- ✅ **Simple API** - Easy to use
- ✅ **Free Tier** - 100GB storage + 1TB bandwidth

### Usage (Future - Profile Pictures, Workout Files)

```typescript
import { put, del } from '@vercel/blob'

// Upload profile picture
export async function uploadProfilePicture(
  userId: string,
  file: File
): Promise<string> {
  const blob = await put(`profile-pictures/${userId}.jpg`, file, {
    access: 'public',
    addRandomSuffix: false,
  })

  return blob.url
}

// Delete file
export async function deleteFile(url: string): Promise<void> {
  await del(url)
}
```

---

## 5. Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# Authentication
BETTER_AUTH_SECRET="random-secret-here"
BETTER_AUTH_URL="https://tri-train-buddy.vercel.app"

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# Redis (Optional)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Monitoring (Optional)
SENTRY_DSN="https://..."
```

### Managing Secrets

```bash
# Add to Vercel
vercel env add DATABASE_URL production

# Pull from Vercel
vercel env pull .env.local
```

---

## 6. CI/CD Pipeline

### Automatic Deployments

```
Git Push → Vercel Build → Deploy

main branch     → Production (tri-train-buddy.vercel.app)
PR/branch       → Preview (pr-123-tri-train-buddy.vercel.app)
```

### GitHub Actions (Optional - for tests)

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
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

      - name: Run tests
        run: npm test

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint
```

---

## 7. Database Migrations

### Development

```bash
# Create migration
npx prisma migrate dev --name add_achievements

# Apply to development database
npx prisma db push
```

### Production

```bash
# Apply migrations on deploy
npm run build
# build command: prisma generate && prisma migrate deploy && next build
```

### Migration Strategy

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

---

## 8. Monitoring & Observability

### Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Error Tracking (Sentry)

```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/tri-train-buddy\.vercel\.app/],
    }),
  ],
})

// Capture exceptions
try {
  await generatePlan()
} catch (error) {
  Sentry.captureException(error)
  throw error
}
```

### Custom Logging

```typescript
// File: app/lib/logger.ts

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      meta,
      timestamp: new Date().toISOString(),
    }))
  },

  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      meta,
      timestamp: new Date().toISOString(),
    }))
  },

  warn: (message: string, meta?: any) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      meta,
      timestamp: new Date().toISOString(),
    }))
  },
}

// Usage
logger.info('Plan generated', { userId, planId })
logger.error('Failed to generate plan', error, { userId })
```

---

## 9. Performance Optimization

### Edge Runtime (Future)

```typescript
// Use edge runtime for low-latency routes
export const runtime = 'edge'

export async function GET(req: Request) {
  // This runs on Vercel Edge Network
  // Low latency, but limited Node.js APIs
}
```

### Caching Strategy

```typescript
// Static pages (cached indefinitely)
export const revalidate = false

// Incremental Static Regeneration (revalidate every 60s)
export const revalidate = 60

// Dynamic (no caching)
export const dynamic = 'force-dynamic'
```

### Image Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

---

## 10. Cost Estimation

### Monthly Costs (MVP - 100 active users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Neon | Free | $0 (within free tier) |
| Anthropic Claude | API Usage | ~$50-100/month |
| Upstash Redis | Free | $0 (within free tier) |
| Vercel Blob | Free | $0 (within free tier) |
| **Total** | | **~$70-120/month** |

### Scaling Costs (1,000 users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Neon | Pro | $19/month |
| Anthropic Claude | API Usage | ~$500-1000/month |
| Upstash Redis | Pro | $10/month |
| Vercel Blob | Included | $0 |
| **Total** | | **~$549-1,049/month** |

### Cost Optimization Strategies

1. **Prompt Caching** - Save 90% on repeated AI calls
2. **Model Selection** - Use Haiku for simple tasks, Sonnet for complex
3. **Database Indexing** - Reduce query time → less compute
4. **Edge Caching** - Reduce origin requests
5. **Batch Operations** - Process multiple items together

---

## 11. Backup & Disaster Recovery

### Database Backups

Neon provides:
- **Automatic backups** - Point-in-time recovery (7 days on Free, 30 days on Pro)
- **Manual snapshots** - Before major changes
- **Branch-based backups** - Create branch = instant backup

```bash
# Create backup branch before risky operation
neonctl branches create --name backup-before-migration
```

### Disaster Recovery Plan

1. **Database failure** → Restore from Neon backup (< 5 minutes)
2. **Vercel outage** → Deploy to backup provider (Netlify/Railway)
3. **Data corruption** → Rollback to previous migration
4. **Security breach** → Rotate secrets, notify users, audit logs

---

## 12. Security Checklist

### Pre-Production

- [ ] All environment variables in Vercel (not in code)
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Database SSL required (Neon default)
- [ ] Authentication on all API routes
- [ ] Input validation with Zod
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (React auto-escaping)
- [ ] CSRF protection (SameSite cookies)
- [ ] Rate limiting on public endpoints
- [ ] Secrets rotation schedule

### Post-Production

- [ ] Monitor for suspicious activity
- [ ] Regular dependency updates
- [ ] Security audit every 6 months
- [ ] Incident response plan documented
- [ ] User data handling compliant with GDPR

---

## 13. Launch Checklist

### Pre-Launch

- [ ] Database migrations tested
- [ ] All environment variables set
- [ ] Error monitoring configured (Sentry)
- [ ] Analytics configured (Vercel Analytics)
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Robots.txt configured
- [ ] Sitemap generated
- [ ] Privacy policy & Terms of Service published
- [ ] Email sending configured (if needed)

### Launch Day

- [ ] Deploy to production
- [ ] Verify all critical paths work
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Have rollback plan ready

### Post-Launch

- [ ] Monitor user feedback
- [ ] Track key metrics (signups, completions, errors)
- [ ] Plan first iteration based on data
- [ ] Schedule weekly deploys for improvements

---

## 14. Rollback Procedure

### Vercel Instant Rollback

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Database Rollback

```bash
# Revert last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Restore from backup
neonctl branches restore --source backup-branch
```

---

## Summary

Deployment architecture:
- **Vercel** - Hosting, edge functions, automatic deployments
- **Neon** - Serverless PostgreSQL with branching
- **Upstash** - Serverless Redis for caching
- **Anthropic** - AI/LLM API
- **Vercel Blob** - File storage (future)

**Key Benefits:**
- Zero infrastructure management
- Automatic scaling
- Preview deployments for every PR
- Cost-effective for MVP
- Fast global performance

**Estimated Costs:**
- MVP (100 users): ~$70-120/month
- Growth (1k users): ~$500-1k/month
- Scalable to 10k+ users with same architecture

---

**Next:** Monitoring and optimization post-launch

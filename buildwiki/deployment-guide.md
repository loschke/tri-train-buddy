# Deployment Guide

## Overview

Step-by-step guide für das Deployment von Tri-Train-Buddy auf Vercel mit Neon Database.

---

## Prerequisites

- [ ] GitHub Account
- [ ] Vercel Account
- [ ] Neon Account
- [ ] Anthropic API Key
- [ ] Domain (optional)

---

## 1. Initial Setup

### 1.1 Create Neon Database

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create new project: "tri-train-buddy-prod"
3. Region: Choose closest to your users (e.g., Frankfurt/EU)
4. Copy connection strings:
   - **DATABASE_URL** (with pooling)
   - **DIRECT_DATABASE_URL** (without pooling)

**Example:**
```
DATABASE_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

---

### 1.2 Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import your repository
4. Configure project settings:

**Framework Preset:** Next.js
**Build Command:** `prisma generate && prisma migrate deploy && next build`
**Output Directory:** (leave default)
**Install Command:** `npm install`

---

## 2. Environment Variables

### 2.1 Required Variables

Add these in Vercel Project Settings → Environment Variables:

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...

# Authentication
BETTER_AUTH_SECRET=generate-random-32-char-string-here
BETTER_AUTH_URL=https://your-app.vercel.app

# AI
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### 2.2 Generate Secure Secrets

```bash
# BETTER_AUTH_SECRET
openssl rand -base64 32
```

### 2.3 Optional Variables

```bash
# Monitoring
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Caching
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=...
```

---

## 3. Database Migration

### 3.1 Initial Migration

On first deploy, migrations run automatically via build command.

Verify in Neon Console → Branches → SQL Editor:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Should see: User, AthleteProfile, TrainingPlan, Workout, etc.
```

### 3.2 Future Migrations

For schema changes:

```bash
# Local development
npx prisma migrate dev --name add_new_feature

# Commit migration files
git add prisma/migrations
git commit -m "feat: Add new feature migration"
git push

# Vercel will run migration on deploy
```

**Rollback if needed:**
```bash
# Create Neon branch before risky migration
neonctl branches create --name backup-before-migration

# If migration fails, restore
neonctl branches restore --source backup-before-migration
```

---

## 4. Deploy

### 4.1 Production Deployment

```bash
# Option 1: Via Git (Recommended)
git push origin main
# Vercel auto-deploys

# Option 2: Via Vercel CLI
vercel --prod
```

### 4.2 Preview Deployments

Every PR gets a preview URL:

```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
# Open PR → Vercel creates preview at: tri-train-buddy-git-feature-username.vercel.app
```

**Use for:**
- Testing before merge
- Sharing with team
- QA testing

---

## 5. Post-Deploy Verification

### 5.1 Smoke Tests

Visit production URL and test:

- [ ] Homepage loads
- [ ] Can register new account
- [ ] Can login
- [ ] Dashboard loads
- [ ] No console errors (F12)

### 5.2 Check Vercel Logs

```bash
vercel logs --prod
# Or via Vercel Dashboard → Deployments → Functions
```

Look for:
- ✅ No errors
- ✅ Prisma connected
- ✅ API routes responding

### 5.3 Verify Database

In Neon Console:

```sql
-- Check users created
SELECT COUNT(*) FROM "User";

-- Check no orphaned data
SELECT COUNT(*) FROM "Workout" WHERE "userId" NOT IN (SELECT id FROM "User");
```

---

## 6. Custom Domain Setup

### 6.1 Add Domain in Vercel

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `tri-train-buddy.com`
3. Follow DNS instructions

### 6.2 DNS Configuration

Add these records to your DNS provider:

**Option A: Apex Domain**
```
A Record
Name: @
Value: 76.76.21.21
```

**Option B: Subdomain**
```
CNAME Record
Name: app
Value: cname.vercel-dns.com
```

### 6.3 Update Environment Variables

```bash
BETTER_AUTH_URL=https://tri-train-buddy.com
NEXT_PUBLIC_APP_URL=https://tri-train-buddy.com
```

Redeploy after updating.

---

## 7. Monitoring Setup

### 7.1 Vercel Analytics

Already enabled by default. View in:
- Vercel Dashboard → Analytics

### 7.2 Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Add to Vercel env vars:
```bash
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### 7.3 Uptime Monitoring

Use a service like:
- [UptimeRobot](https://uptimerobot.com) (Free)
- [Pingdom](https://www.pingdom.com)
- [BetterUptime](https://betteruptime.com)

Monitor endpoint: `https://your-app.vercel.app/api/health`

Create health check endpoint:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    )
  }
}
```

---

## 8. Scaling Considerations

### 8.1 Database Scaling (Neon)

Monitor in Neon Console → Usage:

- **Free Tier Limits:**
  - 0.5 GB storage
  - 100 hours compute/month

**When to upgrade:**
- Storage > 400 MB
- Compute hours depleting
- Need more branches

**Upgrade to Pro ($19/month):**
- 10 GB storage
- Unlimited compute
- Point-in-time recovery

### 8.2 Vercel Scaling

Automatic with Vercel Pro ($20/month):
- Unlimited deployments
- Advanced analytics
- Better support

### 8.3 AI Cost Management

Monitor Anthropic usage:

```typescript
// Track costs
let totalCost = 0

async function trackAICost(inputTokens: number, outputTokens: number) {
  const cost = calculateCost(inputTokens, outputTokens)
  totalCost += cost

  // Log daily
  await prisma.aiCostLog.create({
    data: { date: new Date(), cost, inputTokens, outputTokens },
  })
}
```

**Alerts:**
- Set budget alert in Anthropic Console
- Monitor daily spend
- If > $100/day → investigate

---

## 9. Backup Strategy

### 9.1 Database Backups

**Automatic (Neon):**
- Free: 7 days point-in-time recovery
- Pro: 30 days

**Manual Backups:**

```bash
# Create branch before major changes
neonctl branches create --name backup-$(date +%Y%m%d)

# Export data
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### 9.2 Code Backups

```bash
# Tag releases
git tag v2.0.0
git push --tags

# GitHub is primary backup
```

---

## 10. Deployment Checklist

### Pre-Deploy
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database migration tested
- [ ] No hardcoded secrets
- [ ] Build succeeds locally

### Deploy
- [ ] Create Git tag
- [ ] Push to main/deploy
- [ ] Monitor deployment logs
- [ ] Verify build success

### Post-Deploy
- [ ] Run smoke tests
- [ ] Check error logs (first 30 min)
- [ ] Verify database connected
- [ ] Test critical paths
- [ ] Monitor performance
- [ ] Check AI costs

### Emergency Rollback
- [ ] `vercel rollback` ready
- [ ] Database backup available
- [ ] Team notified

---

## 11. Maintenance

### Weekly
- [ ] Check error logs (Sentry)
- [ ] Review performance (Vercel Analytics)
- [ ] Monitor AI costs (Anthropic Console)
- [ ] Check database size (Neon Console)

### Monthly
- [ ] Review and optimize database queries
- [ ] Clean up old data (if needed)
- [ ] Update dependencies (`npm outdated`)
- [ ] Security audit (`npm audit`)

### Quarterly
- [ ] Review scaling needs
- [ ] Analyze user growth
- [ ] Plan infrastructure changes
- [ ] Update documentation

---

## 12. Troubleshooting

See [troubleshooting.md](./troubleshooting.md) for common issues.

**Quick Checks:**

**Build fails:**
```bash
# Check locally
npm run build

# Check Vercel logs
vercel logs --prod
```

**Database connection fails:**
```sql
-- Test in Neon SQL Editor
SELECT NOW();
```

**500 errors:**
```bash
# Check Sentry or Vercel logs
# Look for stack traces
```

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Anthropic Docs:** https://docs.anthropic.com
- **Next.js Docs:** https://nextjs.org/docs

---

**Deployment Time Estimate:**
- Initial setup: 2-3 hours
- Future deploys: 5-10 minutes (automated)

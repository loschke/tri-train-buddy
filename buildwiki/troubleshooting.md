# Troubleshooting Guide

## Common Issues & Solutions

Quick reference for häufige Probleme during development and deployment.

---

## 1. Database Issues

### Problem: "Can't reach database server"

**Symptoms:**
```
PrismaClientInitializationError: Can't reach database server
```

**Solutions:**

1. **Check connection string:**
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Should start with postgresql://
```

2. **Test connection manually:**
```bash
# Install psql
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Test connection
psql $DATABASE_URL
```

3. **Neon-specific:**
- Check if database is in sleep mode (Free tier auto-suspends)
- Go to Neon Console → Wake database
- Consider upgrading to Pro for always-on

4. **Vercel deployment:**
- Verify env vars in Vercel Dashboard
- Use `DIRECT_DATABASE_URL` for migrations
- Use `DATABASE_URL` (with pooling) for app

---

### Problem: Migration fails

**Symptoms:**
```
Error: P3009: Migration failed to apply cleanly
```

**Solutions:**

1. **Development:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or push schema without migration
npx prisma db push
```

2. **Production:**
```bash
# Create Neon branch backup first
neonctl branches create --name backup-before-fix

# Try migration repair
npx prisma migrate resolve --applied <migration-name>

# Or rollback
npx prisma migrate resolve --rolled-back <migration-name>
```

3. **Schema drift:**
```bash
# Check current state
npx prisma migrate status

# Create new baseline
npx prisma migrate dev --create-only
# Edit migration to match current state
npx prisma migrate dev
```

---

### Problem: "Unique constraint violation"

**Symptoms:**
```
Unique constraint failed on the fields: (`email`)
```

**Solutions:**

1. **Check for duplicates:**
```sql
SELECT email, COUNT(*) FROM "User" GROUP BY email HAVING COUNT(*) > 1;
```

2. **Clean up duplicates:**
```sql
-- Find duplicate IDs
WITH duplicates AS (
  SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY createdAt) as rn
  FROM "User"
)
DELETE FROM "User" WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

3. **Prevent in code:**
```typescript
// Use upsert instead of create
await prisma.user.upsert({
  where: { email },
  update: {},
  create: { email, name },
})
```

---

## 2. Authentication Issues

### Problem: "Unauthorized" on protected routes

**Symptoms:**
- Redirects to /login immediately
- `session` is null

**Solutions:**

1. **Check auth configuration:**
```typescript
// Verify BETTER_AUTH_SECRET is set
console.log('Auth secret:', process.env.BETTER_AUTH_SECRET ? 'Set' : 'Missing')
```

2. **Check cookies:**
- Open DevTools → Application → Cookies
- Look for `better-auth.session_token`
- If missing: login flow broken
- If present: session validation issue

3. **Verify auth middleware:**
```typescript
// app/lib/auth-helpers.ts
export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })

  console.log('Session:', session) // Debug log

  if (!session?.user) {
    redirect('/login')
  }

  return session.user
}
```

4. **CORS issues (if using custom domain):**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.BETTER_AUTH_URL },
        ],
      },
    ]
  },
}
```

---

### Problem: Login works locally but not in production

**Solutions:**

1. **Check BETTER_AUTH_URL:**
```bash
# In Vercel env vars, should be:
BETTER_AUTH_URL=https://your-actual-domain.vercel.app

# NOT localhost
```

2. **Check secure cookies:**
- Production requires HTTPS
- Vercel provides this automatically
- Custom domains need SSL certificate

3. **Session expiry:**
```typescript
// Extend session duration if needed
export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
  },
})
```

---

## 3. AI/Claude API Issues

### Problem: "429 Too Many Requests"

**Symptoms:**
```
AnthropicError: rate_limit_error
```

**Solutions:**

1. **Check rate limits:**
- Anthropic has tier-based limits
- Free tier: Lower limits
- Check Console for current tier

2. **Implement retry with backoff:**
```typescript
async function callClaudeWithRetry(prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await anthropic.messages.create({ ... })
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}
```

3. **Reduce concurrent requests:**
```typescript
// Use queue for plan generation
const planQueue = new PQueue({ concurrency: 2 })

export async function generatePlan(userId: string) {
  return planQueue.add(() => generateTrainingPlan(userId))
}
```

---

### Problem: AI responses are invalid JSON

**Symptoms:**
```
SyntaxError: Unexpected token in JSON
```

**Solutions:**

1. **Use structured outputs:**
```typescript
// Explicitly request JSON
const systemPrompt = `...
IMPORTANT: Return ONLY valid JSON, no markdown formatting.
`

// Or use Zod with Vercel AI SDK
import { generateObject } from 'ai'

const result = await generateObject({
  model: anthropic('claude-sonnet-4'),
  schema: TrainingPlanSchema,
  prompt,
})
```

2. **Strip markdown:**
```typescript
function extractJSON(text: string): any {
  // Remove markdown code blocks
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  return JSON.parse(cleaned)
}
```

3. **Validate before parsing:**
```typescript
try {
  const parsed = JSON.parse(response)
  return TrainingPlanSchema.parse(parsed)
} catch (error) {
  logger.error('Invalid AI response', error, { response })
  // Fallback or retry
  throw new Error('AI returned invalid data')
}
```

---

### Problem: AI costs too high

**Solutions:**

1. **Enable prompt caching:**
```typescript
// Cache system prompts (90% savings on repeat calls)
system: [
  {
    type: 'text',
    text: systemPrompt,
    cache_control: { type: 'ephemeral' },
  },
],
```

2. **Use cheaper models:**
```typescript
// Haiku for simple tasks
model: 'claude-haiku-4-20250514'  // ~20x cheaper

// Sonnet only for complex reasoning
model: 'claude-sonnet-4-20250514'
```

3. **Reduce token usage:**
```typescript
// Shorter prompts
max_tokens: 512  // Instead of 4096 for simple responses

// Load less training wiki content
const relevantDocs = selectTopNDocs(goalType, 3)  // Not all docs
```

4. **Cache results:**
```typescript
// Cache daily insights
const cached = await redis.get(`insight:${userId}:${today}`)
if (cached) return JSON.parse(cached)

const insight = await generateDailyInsight(userId)
await redis.set(`insight:${userId}:${today}`, JSON.stringify(insight), { ex: 86400 })
```

---

## 4. Performance Issues

### Problem: Dashboard loads slowly (> 3s)

**Solutions:**

1. **Add database indexes:**
```prisma
model Workout {
  @@index([userId, date])
  @@index([userId, completed])
}
```

2. **Optimize queries:**
```typescript
// Bad: Multiple queries
const user = await prisma.user.findUnique({ where: { id } })
const profile = await prisma.athleteProfile.findUnique({ where: { userId: id } })

// Good: Single query with include
const user = await prisma.user.findUnique({
  where: { id },
  include: { athleteProfile: true },
})
```

3. **Cache expensive operations:**
```typescript
import { unstable_cache } from 'next/cache'

const getCachedData = unstable_cache(
  async (userId) => expensiveQuery(userId),
  ['dashboard-data'],
  { revalidate: 60 } // 1 minute
)
```

4. **Use parallel requests:**
```typescript
// Bad: Sequential
const profile = await getProfile()
const workouts = await getWorkouts()
const insights = await getInsights()

// Good: Parallel
const [profile, workouts, insights] = await Promise.all([
  getProfile(),
  getWorkouts(),
  getInsights(),
])
```

---

### Problem: Vercel function timeout (10s limit)

**Solutions:**

1. **Move to background job:**
```typescript
// Don't wait for AI analysis
await prisma.workoutFeedback.create({ data: feedback })

// Trigger async (don't await)
analyzeFeedback(userId, feedbackId).catch(console.error)

return NextResponse.json({ success: true })
```

2. **Use Edge Runtime:**
```typescript
// app/api/quick-route/route.ts
export const runtime = 'edge' // 30s timeout instead of 10s
```

3. **Optimize AI calls:**
```typescript
// Reduce max_tokens
max_tokens: 1024  // Instead of 4096

// Use streaming (if applicable)
stream: true
```

---

## 5. Deployment Issues

### Problem: Build fails on Vercel

**Symptoms:**
```
Error: Command "npm run build" exited with 1
```

**Solutions:**

1. **Check build locally:**
```bash
npm run build

# If fails locally, fix errors
# If succeeds locally, check env vars
```

2. **Common build errors:**

**TypeScript errors:**
```bash
# Strict mode issues
npm run type-check

# Fix or disable strict (not recommended)
// tsconfig.json
"strict": false
```

**Missing dependencies:**
```bash
# Ensure all deps in package.json
npm install <missing-package>
git add package.json package-lock.json
```

**Prisma client not generated:**
```bash
# Add to build command in Vercel
prisma generate && next build
```

3. **Check Vercel build logs:**
- Vercel Dashboard → Deployment → Build Logs
- Look for specific error
- Often shows file and line number

---

### Problem: Environment variables not working

**Solutions:**

1. **Check spelling:**
- `DATABASE_URL` not `DB_URL`
- Case-sensitive

2. **Redeploy after adding:**
- Adding env vars requires redeploy
- Vercel Dashboard → Deployments → Redeploy

3. **Use correct prefix:**
- Client-side: `NEXT_PUBLIC_*`
- Server-side: No prefix

```typescript
// Client (browser)
const url = process.env.NEXT_PUBLIC_API_URL

// Server only
const secret = process.env.DATABASE_URL
```

---

## 6. Mobile/Responsive Issues

### Problem: Layout breaks on mobile

**Solutions:**

1. **Use responsive classes:**
```typescript
// Bad
<div className="grid-cols-3">

// Good
<div className="grid-cols-1 md:grid-cols-3">
```

2. **Test on actual devices:**
- Chrome DevTools → Toggle Device Toolbar
- Test on iPhone (Safari)
- Test on Android (Chrome)

3. **Fix common issues:**

**Horizontal scroll:**
```css
/* Find culprit with */
* { outline: 1px solid red; }

/* Fix with */
.overflow-x-hidden
max-w-full
```

**Text too small:**
```typescript
// Increase base font size
<p className="text-sm md:text-base">
```

**Touch targets too small:**
```typescript
// Minimum 44x44px
<button className="p-3 min-h-[44px]">
```

---

## 7. Data Issues

### Problem: User data not showing

**Solutions:**

1. **Check data exists:**
```sql
SELECT * FROM "User" WHERE email = 'test@example.com';
SELECT * FROM "AthleteProfile" WHERE "userId" = 'xxx';
```

2. **Check relations:**
```typescript
// Include relations
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    athleteProfile: true,
    trainingPlans: true,
  },
})

console.log('User data:', user)
```

3. **Verify IDs match:**
```sql
-- Check for orphaned data
SELECT * FROM "Workout"
WHERE "userId" NOT IN (SELECT id FROM "User");
```

---

## 8. Getting Help

### Before asking for help:

1. **Check logs:**
   - Browser console (F12)
   - Vercel function logs
   - Sentry errors
   - Database query logs

2. **Reproduce:**
   - Can you reproduce locally?
   - Specific steps to trigger bug

3. **Gather info:**
   - Error message (full stack trace)
   - What you expected vs what happened
   - Environment (local/production)
   - Recent changes

### Where to ask:

- **Vercel Issues:** https://vercel.com/support
- **Neon Discord:** https://neon.tech/discord
- **Next.js Discussions:** https://github.com/vercel/next.js/discussions
- **Anthropic Discord:** https://discord.gg/anthropic

---

## Emergency Procedures

### Site is down

1. **Check Vercel status:**
   - https://www.vercel-status.com

2. **Rollback:**
```bash
vercel rollback
```

3. **Check database:**
   - Neon Console → Check if online

4. **Restore from backup:**
```bash
neonctl branches restore --source backup-branch
```

### Data loss

1. **Stop writes immediately**
2. **Check Neon backups:**
   - Console → Branches → Restore point-in-time
3. **Contact support if needed**

---

**Last Resort:** Create GitHub issue with full details

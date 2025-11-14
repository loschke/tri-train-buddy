# Phase 1: Foundation

## Ziel
Funktionierende Basis-Infrastruktur mit Database, Authentication und grundlegendem Setup.

**Duration:** 1-2 Wochen
**Effort:** ~40-60 Stunden
**Risk Level:** 🟢 Low

---

## Voraussetzungen

- [ ] Node.js 20+ installiert
- [ ] Git installiert
- [ ] Vercel Account erstellt
- [ ] Neon Database Account erstellt
- [ ] Anthropic API Key vorhanden
- [ ] VS Code oder bevorzugter Editor

---

## Phase Milestones

### Milestone 1.1: Project Setup (Tag 1-2)
**Ziel:** Projekt-Struktur und Dependencies

### Milestone 1.2: Database Schema (Tag 3-4)
**Ziel:** Prisma Schema deployed und funktionsfähig

### Milestone 1.3: Authentication (Tag 5-6)
**Ziel:** User kann sich registrieren und anmelden

### Milestone 1.4: Basic UI (Tag 7-8)
**Ziel:** Dashboard und Navigation funktionieren

### Milestone 1.5: Testing & Deployment (Tag 9-10)
**Ziel:** Deployed auf Vercel, alle Tests grün

---

## Milestone 1.1: Project Setup

### Tasks

#### 1.1.1 Initialize Next.js Project
**Estimated Time:** 30 min

```bash
# Create Next.js app
npx create-next-app@latest tri-train-buddy-v2 \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir false \
  --import-alias "@/*"

cd tri-train-buddy-v2
```

**Verification:**
- [ ] `npm run dev` startet ohne Errors
- [ ] Kann http://localhost:3000 öffnen
- [ ] TypeScript kompiliert

---

#### 1.1.2 Install Core Dependencies
**Estimated Time:** 20 min

```bash
# Database & ORM
npm install @prisma/client
npm install -D prisma

# Authentication
npm install better-auth

# UI Components
npm install @radix-ui/react-slot
npm install class-variance-authority
npm install clsx tailwind-merge
npm install lucide-react

# AI & Validation
npm install @anthropic-ai/sdk
npm install zod
npm install ai

# Utilities
npm install date-fns
npm install nanoid
```

**Verification:**
- [ ] `package.json` enthält alle Dependencies
- [ ] `npm install` läuft ohne Warnings

---

#### 1.1.3 Setup Shadcn/ui
**Estimated Time:** 30 min

```bash
# Initialize shadcn
npx shadcn-ui@latest init

# Install essential components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add toast
```

**Verification:**
- [ ] `components/ui/` Folder existiert
- [ ] `components.json` konfiguriert
- [ ] Kann Button importieren und verwenden

---

#### 1.1.4 Project Structure
**Estimated Time:** 20 min

Erstelle folgende Ordnerstruktur:

```
app/
├── api/                 # API Routes
├── actions/             # Server Actions
├── dashboard/           # Dashboard Pages
├── onboarding/          # Onboarding Flow
├── lib/                 # Shared Utilities
│   ├── ai/             # AI Engines
│   ├── utils.ts        # Helper Functions
│   ├── auth.ts         # Auth Config
│   └── prisma.ts       # Prisma Client
├── components/          # React Components
│   └── ui/             # Shadcn Components
└── globals.css         # Global Styles

prisma/
└── schema.prisma       # Database Schema

public/
└── ...                 # Static Assets
```

**Verification:**
- [ ] Alle Ordner existieren
- [ ] `.gitignore` enthält `node_modules`, `.env*`

---

#### 1.1.5 Environment Setup
**Estimated Time:** 15 min

Erstelle `.env.local`:

```bash
# Database (Neon)
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# Authentication
BETTER_AUTH_SECRET="generate-random-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Erstelle `.env.example`:
```bash
DATABASE_URL=
DIRECT_DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=
```

**Verification:**
- [ ] `.env.local` existiert und ist in `.gitignore`
- [ ] `.env.example` committed

---

## Milestone 1.2: Database Schema

**Reference:** `techwiki/02-database/schema-design.md`

### Tasks

#### 1.2.1 Create Prisma Schema
**Estimated Time:** 1 hour

Erstelle `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

// User Model (BetterAuth compatible)
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  athleteProfile AthleteProfile?
  trainingPlans  TrainingPlan[]
  workouts       Workout[]
  feedbacks      WorkoutFeedback[]
  preferences    AthletePreference[]
  achievements   Achievement[]
  knowledge      AthleteKnowledge[]
  sessions       Session[]
  accounts       Account[]

  @@index([email])
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

// Athlete Profile
model AthleteProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Goal
  goal              String
  goalType          String // MARATHON, IRONMAN, etc.
  goalDate          DateTime

  // Current Level (JSON)
  currentLevel      Json // { experience: "intermediate", runDistance: "10km", ... }

  // Availability (JSON)
  availability      Json // { mornings: ["Mon", "Wed"], preferredTime: "morning", ... }

  // Constraints
  injuryHistory     String[] // ["knee-pain-2023", ...]
  riskProfile       String   @default("MODERATE") // CONSERVATIVE, MODERATE, AGGRESSIVE

  // AI Learned Preferences (JSON)
  learnedPreferences Json @default("{}")

  // Onboarding
  onboardingCompleted Boolean @default(false)
  onboardingStep      Int     @default(0)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([goalDate])
}

// Training Plan
model TrainingPlan {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  startDate DateTime
  endDate   DateTime
  status    String   @default("ACTIVE") // ACTIVE, COMPLETED, ARCHIVED

  // Planning Context
  phase         String // BASE, BUILD, PEAK, TAPER
  generatedBy   String // AI model version
  constraints   Json   @default("[]") // Active constraints
  rationale     String @db.Text // Why this plan?

  // Relations
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workouts Workout[]

  @@index([userId])
  @@index([status])
  @@index([startDate])
}

// Workout
model Workout {
  id        String   @id @default(cuid())
  planId    String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  date         DateTime
  discipline   String // RUN, BIKE, SWIM, STRENGTH, REST
  type         String // EASY, LONG, THRESHOLD, INTERVALS, etc.
  title        String
  description  String @db.Text
  durationMin  Int
  intensityZone String? // Z1, Z2, Z3, Z4, Z5

  // Educational Layer
  explanation     String  @db.Text
  executionTips   String? @db.Text
  isFirstOfType   Boolean @default(false)

  // Completion
  completed   Boolean   @default(false)
  completedAt DateTime?
  skipped     Boolean   @default(false)
  skippedReason String?

  // Relations
  plan     TrainingPlan      @relation(fields: [planId], references: [id], onDelete: Cascade)
  user     User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  feedback WorkoutFeedback[]

  @@index([userId])
  @@index([planId])
  @@index([date])
  @@index([completed])
}

// Workout Feedback
model WorkoutFeedback {
  id        String   @id @default(cuid())
  workoutId String
  userId    String
  createdAt DateTime @default(now())

  // Simple Feedback
  feeling              Int // 1-5
  perceivedDifficulty  Int // 1-10
  notes                String? @db.Text

  // Rich Feedback (Optional)
  tooHard          Boolean?
  tooEasy          Boolean?
  motivationLevel  Int? // 1-5

  // AI Analysis
  aiAnalysis Json?
  analyzed   Boolean   @default(false)
  analyzedAt DateTime?

  // Relations
  workout Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workoutId]) // One feedback per workout
  @@index([userId])
  @@index([createdAt])
}

// Athlete Preference (Learned from AI)
model AthletePreference {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  category    String // RECOVERY, INTENSITY, SCHEDULING, etc.
  key         String // Unique key per category
  value       Json   // Flexible structure
  learnedFrom String // "feedback-analysis", "onboarding"

  confidence Float @default(0.5) // 0.0 - 1.0
  dataPoints Int   @default(1) // How many observations
  active     Boolean @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, key])
  @@index([userId])
  @@index([active])
}

// Achievement
model Achievement {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())

  type        String // FIRST_WORKOUT, STREAK_7, etc.
  tier        Int // 1=Bronze, 2=Silver, 3=Gold
  title       String
  description String
  icon        String
  points      Int    @default(0)

  unlockedAt DateTime @default(now())
  viewed     Boolean  @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([type])
}

// Athlete Knowledge (Educational Tracking)
model AthleteKnowledge {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  conceptId    String // "zone-2-training", "threshold-pace"
  introducedAt DateTime @default(now())
  reinforced   Int      @default(1) // How many times seen
  mastered     Boolean  @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, conceptId])
  @@index([userId])
}
```

**Verification:**
- [ ] Schema kompiliert ohne Errors
- [ ] Alle Relations sind korrekt

---

#### 1.2.2 Generate Prisma Client
**Estimated Time:** 10 min

```bash
npx prisma generate
```

**Verification:**
- [ ] `node_modules/.prisma/client` generiert
- [ ] Kann Prisma Client importieren

---

#### 1.2.3 Create Database Migration
**Estimated Time:** 15 min

```bash
# Push schema to database
npx prisma db push

# Or create migration (production-style)
npx prisma migrate dev --name init
```

**Verification:**
- [ ] Migration erfolgreich
- [ ] Kann Neon Database Console öffnen
- [ ] Alle Tables existieren

---

#### 1.2.4 Create Prisma Client Singleton
**Estimated Time:** 10 min

Erstelle `app/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Verification:**
- [ ] Kann `import { prisma } from '@/lib/prisma'` nutzen
- [ ] Keine Connection-Errors

---

## Milestone 1.3: Authentication

**Reference:** `techwiki/06-api-design/README.md`

### Tasks

#### 1.3.1 Setup BetterAuth
**Estimated Time:** 45 min

Erstelle `app/lib/auth.ts`:

```typescript
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  trustedOrigins: [
    'http://localhost:3000',
    process.env.BETTER_AUTH_URL || '',
  ],
})
```

Erstelle `app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

**Verification:**
- [ ] `/api/auth/signin` erreichbar
- [ ] `/api/auth/signup` erreichbar

---

#### 1.3.2 Create Auth Helper
**Estimated Time:** 20 min

Erstelle `app/lib/auth-helpers.ts`:

```typescript
import { auth } from './auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/login')
  }

  return session.user
}

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}
```

**Verification:**
- [ ] Helper-Funktionen kompilieren

---

#### 1.3.3 Create Login/Signup Pages
**Estimated Time:** 1.5 hours

Erstelle `app/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Invalid credentials')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </Button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Noch kein Account?{' '}
          <a href="/signup" className="text-blue-600 hover:underline">
            Registrieren
          </a>
        </p>
      </Card>
    </div>
  )
}
```

Erstelle analog `app/signup/page.tsx` (ähnlich, aber mit signup endpoint)

**Verification:**
- [ ] Kann `/login` öffnen
- [ ] Kann `/signup` öffnen
- [ ] Formular sieht gut aus

---

## Milestone 1.4: Basic UI

### Tasks

#### 1.4.1 Create Dashboard Layout
**Estimated Time:** 1 hour

Erstelle `app/dashboard/layout.tsx`:

```typescript
import { requireAuth } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Tri-Train-Buddy</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <Button variant="outline" size="sm" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
```

**Verification:**
- [ ] Layout rendert korrekt
- [ ] Header zeigt User-Email
- [ ] Logout-Button vorhanden

---

#### 1.4.2 Create Basic Dashboard
**Estimated Time:** 1 hour

Erstelle `app/dashboard/page.tsx`:

```typescript
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/card'

export default async function DashboardPage() {
  const user = await requireAuth()

  // Check if onboarding completed
  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: user.id },
  })

  if (!profile || !profile.onboardingCompleted) {
    redirect('/onboarding')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Willkommen zurück!</h3>
          <p className="text-sm text-gray-600">
            Dein Trainingsplan wird geladen...
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Status</h3>
          <p className="text-sm text-gray-600">
            Phase 1 komplett ✅
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Nächste Schritte</h3>
          <p className="text-sm text-gray-600">
            Phase 2: AI Core
          </p>
        </Card>
      </div>
    </div>
  )
}
```

**Verification:**
- [ ] Dashboard lädt ohne Errors
- [ ] Cards werden angezeigt
- [ ] Redirect zu onboarding wenn kein Profile

---

## Milestone 1.5: Testing & Deployment

### Tasks

#### 1.5.1 Manual Testing
**Estimated Time:** 1 hour

**Test Checklist:**
- [ ] Signup funktioniert (neuer User erstellt in DB)
- [ ] Login funktioniert (Session erstellt)
- [ ] Logout funktioniert (Session gelöscht)
- [ ] Dashboard nur mit Login erreichbar
- [ ] Protected Routes redirecten zu /login
- [ ] Database Verbindung stabil

**Bug Tracking:**
Dokumentiere alle gefundenen Bugs in `bugs-phase1.md`

---

#### 1.5.2 Deploy to Vercel
**Estimated Time:** 30 min

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Environment Variables in Vercel setzen:**
- DATABASE_URL
- DIRECT_DATABASE_URL
- BETTER_AUTH_SECRET
- BETTER_AUTH_URL (https://your-app.vercel.app)
- ANTHROPIC_API_KEY

**Verification:**
- [ ] Deployment erfolgreich
- [ ] Production URL funktioniert
- [ ] Kann registrieren und anmelden
- [ ] Database Connected

---

#### 1.5.3 Create Phase 1 Git Tag
**Estimated Time:** 5 min

```bash
git add .
git commit -m "feat: Complete Phase 1 - Foundation"
git tag v2.0-phase1
git push origin main
git push --tags
```

---

## Success Criteria

Phase 1 ist **erfolgreich abgeschlossen**, wenn:

- ✅ User kann sich registrieren
- ✅ User kann sich anmelden
- ✅ User sieht Dashboard (statisch)
- ✅ Database Schema deployed
- ✅ Deployed auf Vercel (funktionsfähig)
- ✅ Alle Protected Routes funktionieren
- ✅ Keine kritischen Bugs
- ✅ Code auf GitHub gepusht

---

## Rollback Plan

Falls Phase 1 fehlschlägt:

1. **Database Issues:** Restore Neon Branch
2. **Deployment Issues:** Rollback Vercel Deployment
3. **Code Issues:** `git revert` zu letztem stabilen Commit

---

## Next Steps

Nach erfolgreicher Phase 1:

1. ✅ **Review Results** mit Team
2. ✅ **Document Learnings** (was lief gut/schlecht?)
3. ⬜ **Start Phase 2:** AI Core → [phase-2-ai-core.md](./phase-2-ai-core.md)

---

**Estimated Total Time:** 40-60 hours
**Critical Path:** Database → Auth → UI
**Biggest Risk:** Authentication Setup
**Mitigation:** BetterAuth hat gute Docs, Beispiele nutzen

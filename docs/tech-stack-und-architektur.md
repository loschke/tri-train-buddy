# Tech Stack, API Design & Database-Architektur

## 📋 Inhaltsverzeichnis

1. [Tech Stack Übersicht](#tech-stack-übersicht)
2. [Frontend-Architektur](#frontend-architektur)
3. [Backend-Architektur](#backend-architektur)
4. [Datenbank-Design](#datenbank-design)
5. [API-Design](#api-design)
6. [Authentifizierung & Sicherheit](#authentifizierung--sicherheit)
7. [KI-Integration](#ki-integration)
8. [Deployment & DevOps](#deployment--devops)

---

## 🔧 Tech Stack Übersicht

### Core Framework & Runtime

| Technologie | Version | Zweck | Warum gewählt? |
|-------------|---------|-------|----------------|
| **Next.js** | 15.4.6 | Full-stack React Framework | Server-Side Rendering, API Routes, File-based Routing, Production-ready |
| **React** | 19.1.0 | UI Library | Industry Standard, große Community, performant |
| **TypeScript** | 5.x | Typsicherheit | Verhindert Runtime-Fehler, bessere DX, Code-Dokumentation |
| **Node.js** | 18+ | JavaScript Runtime | Erforderlich für Next.js, große Ökosystem |

### Database & ORM

| Technologie | Version | Zweck | Warum gewählt? |
|-------------|---------|-------|----------------|
| **PostgreSQL** | 14+ | Relationale Datenbank | Robust, ACID-compliant, kostenlos, Neon-Hosting verfügbar |
| **Prisma** | 6.19.0 | ORM & Migration Tool | Type-safe Queries, automatische Migrations, Dev-Produktivität |
| **Neon** | - | Serverless Postgres | Kostenloser Tier, automatisches Scaling, 0 Maintenance |

### Authentifizierung

| Technologie | Version | Zweck | Warum gewählt? |
|-------------|---------|-------|----------------|
| **BetterAuth** | 1.3.34 | Auth-Library | Modern, einfach, kein Vendor Lock-in, DSGVO-freundlich |

### KI & Machine Learning

| Technologie | Version | Zweck | Warum gewählt? |
|-------------|---------|-------|----------------|
| **Vercel AI SDK** | 5.0.92 | AI Framework | Structured Output, Streaming, Type-safe |
| **@ai-sdk/anthropic** | 2.0.44 | Claude API Integration | Offizielle Anthropic Integration |
| **Claude Sonnet 4** | 20250514 | Large Language Model | Beste Reasoning-Fähigkeiten, strukturierte Ausgaben |

### UI & Styling

| Technologie | Version | Zweck | Warum gewählt? |
|-------------|---------|-------|----------------|
| **Tailwind CSS** | 4.x | Utility-first CSS | Schnelles Styling, keine CSS-Bloat, responsive |
| **Shadcn/ui** | Latest | Component Library | Headless, anpassbar, Copy-Paste, kein npm install |
| **Radix UI** | Latest | Unstyled Components | Accessibility, Keyboard Navigation, ARIA |
| **Lucide React** | 0.553.0 | Icon Library | Modern, Tree-shakeable, SVG-based |

### Forms & Validation

| Technologie | Version | Zweck | Warum gewählt? |
|-------------|---------|-------|----------------|
| **React Hook Form** | 7.66.0 | Form State Management | Performant, minimale Re-renders, einfach |
| **Zod** | 4.1.12 | Schema Validation | Type-safe, composable, Frontend + Backend |

### Data Visualization

| Technologie | Version | Zweck | Warum gewählt? |
|-------------|---------|-------|----------------|
| **Recharts** | 3.4.1 | Charting Library | React-native, responsive, einfach |
| **date-fns** | 4.1.0 | Date Manipulation | Lightweight, Tree-shakeable, bessere DX als Moment.js |

### Development Tools

| Technologie | Version | Zweck | Warum gewählt? |
|-------------|---------|-------|----------------|
| **ESLint** | 9.x | Code Linting | Code-Qualität, Fehler-Prävention |
| **PostCSS** | 8.5.6 | CSS Transformation | Erforderlich für Tailwind |

---

## 🎨 Frontend-Architektur

### Projekt-Struktur

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth Layout Group
│   │   ├── login/page.tsx       # Login-Seite
│   │   └── signup/page.tsx      # Signup-Seite (disabled)
│   ├── (protected)/              # Protected Layout Group
│   │   ├── layout.tsx           # Shared Navigation
│   │   ├── dashboard/page.tsx   # Hauptseite
│   │   ├── onboarding/page.tsx  # Setup-Wizard
│   │   ├── plan/
│   │   │   ├── new/page.tsx     # Plan Generator
│   │   │   └── [cycleId]/page.tsx # Plan Details
│   │   ├── metrics/page.tsx     # Leistungsmetriken
│   │   ├── progress/page.tsx    # Fortschritts-Charts
│   │   └── settings/page.tsx    # Account-Einstellungen
│   ├── api/                      # API Route Handlers
│   │   └── [routes]/route.ts    # REST Endpoints
│   ├── layout.tsx                # Root Layout
│   └── page.tsx                  # Root Redirect
├── components/
│   └── ui/                       # Shadcn UI Components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
├── lib/
│   ├── auth.ts                   # BetterAuth Server Config
│   ├── auth-client.ts            # BetterAuth Client Hooks
│   ├── ai.ts                     # Claude API Integration
│   ├── prisma.ts                 # Prisma Singleton
│   └── utils.ts                  # Utility Functions
└── types/
    └── index.ts                  # TypeScript Type Definitions
```

### Routing-Strategie

**Next.js App Router** (File-based Routing):

```typescript
// Route Groups für Layout-Separation
(auth)          → Keine Navigation, zentriertes Layout
(protected)     → Mit Navigation, Auth-Check

// Dynamic Routes
/plan/[cycleId] → Dynamische Cycle-ID
/api/session/[id] → Dynamische Session-ID

// Parallel Routes (future)
/dashboard/@overview
/dashboard/@upcoming
```

### State Management

**Strategie**: **Server-first, minimaler Client-State**

1. **Server Components** (Default)
   - Alle Pages sind Server Components
   - Data Fetching direkt in Component
   - Kein useState/useEffect nötig

2. **Client Components** (nur wenn nötig)
   - Forms (React Hook Form)
   - Interactive Charts (Recharts)
   - Auth Hooks (useSession)

**Beispiel Dashboard**:
```typescript
// src/app/(protected)/dashboard/page.tsx
export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const data = await getDashboardData(session.user.id)

  return <DashboardView data={data} /> // Server Component
}
```

### Styling-Architektur

**Tailwind CSS Utility-First**:

```tsx
// Beispiel: Card Component
<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
  <div className="flex flex-col space-y-1.5 p-6">
    <h3 className="text-2xl font-semibold leading-none tracking-tight">
      Next 7 Days
    </h3>
  </div>
</div>
```

**Design Tokens** (via CSS Variables):

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --primary: 240 5.9% 10%;
  /* ... */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### Component-Strategie

**Shadcn/ui Copy-Paste Approach**:

```bash
# Komponenten werden kopiert, nicht importiert
npx shadcn@latest add button
npx shadcn@latest add card
```

**Vorteile**:
- Volle Kontrolle über Code
- Keine Black-Box Dependencies
- Einfaches Customizing
- Kein Bundle-Size Overhead

---

## ⚙️ Backend-Architektur

### API Route Handlers (Next.js)

**Datei-Struktur**:

```
src/app/api/
├── auth/[...betterauth]/route.ts  # BetterAuth Catch-All
├── profile/route.ts                # GET, POST /api/profile
├── metrics/
│   ├── route.ts                    # GET, POST /api/metrics
│   └── latest/route.ts             # GET /api/metrics/latest
├── plan/generate/route.ts          # POST /api/plan/generate
├── session/[id]/route.ts           # PATCH /api/session/[id]
├── progress/route.ts               # GET /api/progress
├── user/update/route.ts            # PATCH /api/user/update
└── debug/cycles/route.ts           # GET /api/debug/cycles
```

**Standard Route Handler Pattern**:

```typescript
// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET(req: NextRequest) {
  // 1. Auth Check
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 2. Database Query
  try {
    const profile = await prisma.athleteProfile.findUnique({
      where: { userId: session.user.id }
    })

    // 3. Response
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)

  } catch (error) {
    // 4. Error Handling
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Business Logic Layer

**Separation of Concerns**:

```typescript
// lib/training-logic.ts (planned for v2)
export class TrainingPlanService {
  async generatePlan(userId: string, options: PlanOptions) {
    // 1. Validate inputs
    // 2. Fetch user data
    // 3. Call AI
    // 4. Save to database
    // 5. Return result
  }
}

// lib/metrics-service.ts
export class MetricsService {
  async getLatest(userId: string) { /* ... */ }
  async create(userId: string, data: MetricData) { /* ... */ }
}
```

**Aktuell**: Logic in Route Handlers (MVP-Ansatz)
**Zukunft**: Separate Service-Layer für bessere Testbarkeit

### Datenbank-Zugriff

**Prisma Client Singleton**:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma
```

**Query-Beispiele**:

```typescript
// 1. Find with Relations
const cycle = await prisma.trainingCycle.findFirst({
  where: {
    userId: session.user.id,
    status: 'ACTIVE'
  },
  include: {
    sessions: {
      orderBy: { date: 'asc' }
    }
  }
})

// 2. Create with Nested Relations
const newCycle = await prisma.trainingCycle.create({
  data: {
    userId: session.user.id,
    startDate: new Date(),
    endDate: addDays(new Date(), 14),
    status: 'ACTIVE',
    rationale: aiResponse.rationale,
    sessions: {
      create: [
        { date: '2025-11-11', discipline: 'RUN', /* ... */ },
        // ... 13 more
      ]
    }
  }
})

// 3. Update with Filters
await prisma.trainingCycle.updateMany({
  where: {
    userId: session.user.id,
    status: 'ACTIVE',
    id: { not: newCycle.id }
  },
  data: { status: 'COMPLETED' }
})
```

---

## 🗄️ Datenbank-Design

### Schema-Übersicht

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// BetterAuth Models (Auto-Generated)
// ============================================

model User {
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  sessions           Session[]
  accounts           Account[]
  athleteProfile     AthleteProfile?
  performanceMetrics PerformanceMetric[]
  trainingCycles     TrainingCycle[]

  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verification")
}

// ============================================
// Custom Application Models
// ============================================

model AthleteProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  raceDate      DateTime
  raceType      String   @default("ironman")
  goalTime      String   // Format: "HH:MM:SS"
  trainingRules Json     // { mondayRest, weekendLong, min/max sessions }
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PerformanceMetric {
  id                String   @id @default(cuid())
  userId            String
  recordedAt        DateTime @default(now())
  runThresholdPace  String   // Format: "MM:SS" (e.g., "5:50")
  runToleranceKm    Int      // Max km/week
  ftpWatts          Int      // Functional Threshold Power
  swimPacePer100m   String   // Format: "MM:SS"
  trainingReadiness Int?     // Scale 0-100
  trainingLoad      String?  // Format: "current/max"
  notes             String?  @db.Text

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, recordedAt])
}

model TrainingCycle {
  id            String      @id @default(cuid())
  userId        String
  startDate     DateTime
  endDate       DateTime
  feedback      String?     @db.Text
  constraints   String?     @db.Text
  status        CycleStatus @default(PLANNED)
  generatedPlan Json?       // Full AI response
  rationale     String?     @db.Text
  createdAt     DateTime    @default(now())

  user     User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions TrainingSession[]

  @@index([userId, startDate])
}

enum CycleStatus {
  PLANNED
  ACTIVE
  COMPLETED
}

model TrainingSession {
  id               String     @id @default(cuid())
  cycleId          String
  date             DateTime
  discipline       Discipline
  durationMinutes  Int
  intensityZone    String?
  description      String     @db.Text
  completed        Boolean    @default(false)
  actualNotes      String?    @db.Text
  syncedToCalendar Boolean    @default(false)
  calendarEventId  String?

  cycle TrainingCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)

  @@index([cycleId, date])
}

enum Discipline {
  RUN
  BIKE
  SWIM
  GYM
  REST
}
```

### Datenbank-Beziehungen

```
User (1) ──────────── (1) AthleteProfile
  │
  ├── (1:N) ──────── PerformanceMetric
  │
  ├── (1:N) ──────── TrainingCycle
  │                      │
  │                      └── (1:N) ── TrainingSession
  │
  ├── (1:N) ──────── Session (BetterAuth)
  │
  └── (1:N) ──────── Account (BetterAuth)
```

### Indexierung-Strategie

**Performance-Optimierungen**:

```sql
-- 1. User-bezogene Queries (häufigste Queries)
CREATE INDEX idx_performance_user_recorded
  ON "PerformanceMetric"(userId, recordedAt);

CREATE INDEX idx_cycle_user_start
  ON "TrainingCycle"(userId, startDate);

CREATE INDEX idx_session_cycle_date
  ON "TrainingSession"(cycleId, date);

-- 2. Unique Constraints (Data Integrity)
ALTER TABLE "User" ADD CONSTRAINT unique_email UNIQUE (email);
ALTER TABLE "Session" ADD CONSTRAINT unique_token UNIQUE (token);
ALTER TABLE "Account" ADD CONSTRAINT unique_provider_account
  UNIQUE (providerId, accountId);
```

### Migration-Strategie

**Prisma Migrations**:

```bash
# Entwicklung: Create + Apply
npx prisma migrate dev --name add_training_load_field

# Produktion: Apply only
npx prisma migrate deploy

# Reset (DANGER!)
npx prisma migrate reset
```

**Migration History**:
```
prisma/migrations/
├── 20251111205254_init/
├── 20251111215548_add_password_field/
├── 20251111220123_add_password_to_account/
├── 20251111221655_add_type_to_account/
└── 20251111222829_fresh_better_auth_schema/
```

---

## 🔌 API-Design

### REST API Konventionen

**HTTP Methods**:

| Method | Verwendung | Beispiel |
|--------|------------|----------|
| GET | Daten abrufen | `GET /api/profile` |
| POST | Neue Ressource erstellen | `POST /api/metrics` |
| PATCH | Teilweise Aktualisierung | `PATCH /api/session/[id]` |
| DELETE | Ressource löschen | `DELETE /api/cycle/[id]` (future) |

**Status Codes**:

| Code | Bedeutung | Verwendung |
|------|-----------|------------|
| 200 | OK | Erfolgreiche GET/PATCH |
| 201 | Created | Erfolgreiche POST |
| 400 | Bad Request | Validation Error |
| 401 | Unauthorized | Kein/ungültiger Session-Token |
| 404 | Not Found | Ressource existiert nicht |
| 500 | Internal Server Error | Unerwarteter Fehler |

### API-Endpunkte (Vollständig)

#### **Authentication**

```typescript
POST /api/auth/sign-in/email
Body: { email: string, password: string }
Response: { user: User, session: Session }

POST /api/auth/sign-out
Response: { success: true }
```

#### **Profile Management**

```typescript
GET /api/profile
Response: AthleteProfile | 404

POST /api/profile
Body: {
  raceDate: string (ISO),
  goalTime: string (HH:MM:SS),
  trainingRules: {
    mondayRest: boolean,
    weekendLong: boolean,
    minBikePerWeek: number,
    maxBikePerWeek: number,
    minRunPerWeek: number,
    maxRunPerWeek: number,
    maxSwimPerWeek: number,
    gymPerWeek: number
  }
}
Response: AthleteProfile
```

#### **Performance Metrics**

```typescript
GET /api/metrics
Response: PerformanceMetric[] (last 10)

POST /api/metrics
Body: {
  runThresholdPace: string (MM:SS),
  runToleranceKm: number,
  ftpWatts: number,
  swimPacePer100m: string (MM:SS),
  trainingReadiness?: number,
  trainingLoad?: string,
  notes?: string
}
Response: PerformanceMetric

GET /api/metrics/latest
Response: PerformanceMetric | null
```

#### **Training Plan Generation**

```typescript
POST /api/plan/generate
Body: {
  startDate?: string (ISO, default: today),
  feedback?: string,
  constraints?: string
}
Response: {
  cycle: TrainingCycle,
  plan: {
    week1: TrainingSession[],
    week2: TrainingSession[],
    rationale: string
  }
}
```

#### **Session Management**

```typescript
PATCH /api/session/[id]
Body: {
  completed?: boolean,
  actualNotes?: string
}
Response: TrainingSession
```

#### **Progress Tracking**

```typescript
GET /api/progress
Response: {
  totalSessions: number,
  completedSessions: number,
  completionRate: number,
  weeklyVolumes: [{
    week: string,
    run: number,
    bike: number,
    swim: number,
    total: number
  }]
}
```

#### **User Management**

```typescript
PATCH /api/user/update
Body: { name: string }
Response: { success: boolean, user: User }
```

### Error Response Format

**Standardisiert**:

```json
{
  "error": "Human-readable error message",
  "details": "Technical details (optional)",
  "code": "ERROR_CODE" // (future)
}
```

**Beispiele**:

```json
// 401 Unauthorized
{
  "error": "Unauthorized",
  "details": "Session token expired"
}

// 404 Not Found
{
  "error": "Profile not found",
  "details": "No athlete profile exists for this user"
}

// 500 Internal Server Error
{
  "error": "Failed to generate training plan",
  "details": "Claude API timeout"
}
```

---

## 🔐 Authentifizierung & Sicherheit

### BetterAuth-Konfiguration

**Server-Side** (`lib/auth.ts`):

```typescript
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!
})
```

**Client-Side** (`lib/auth-client.ts`):

```typescript
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL
})

export const { signIn, signOut, signUp, useSession } = authClient
```

### Session-Management

**Flow**:

1. **Login** → BetterAuth erstellt Session-Token
2. **Token** wird in HTTP-Only Cookie gespeichert
3. **Jeder Request** sendet Cookie automatisch mit
4. **Server** validiert Token via `auth.api.getSession()`
5. **Logout** → Token wird gelöscht

**Session-Daten**:

```typescript
{
  user: {
    id: string,
    email: string,
    name: string,
    image?: string
  },
  session: {
    token: string,
    expiresAt: Date
  }
}
```

### Sicherheitsmaßnahmen

#### **1. SQL Injection Prevention**

```typescript
// ✅ SAFE: Prisma verwendet Prepared Statements
await prisma.user.findUnique({
  where: { email: userInput } // Automatisch escaped
})

// ❌ UNSAFE: Raw Queries
await prisma.$queryRaw`SELECT * FROM user WHERE email = ${userInput}`
```

#### **2. XSS Prevention**

```tsx
// ✅ SAFE: React escaped automatisch
<p>{userInput}</p>

// ❌ UNSAFE: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

#### **3. CSRF Protection**

- BetterAuth nutzt SameSite Cookies
- Next.js App Router hat eingebauten CSRF-Schutz

#### **4. Rate Limiting** (planned v2)

```typescript
// Zukünftig: Upstash Rate Limit
import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s")
})

// In API Route
const { success } = await ratelimit.limit(session.user.id)
if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
```

#### **5. Environment Variables**

```bash
# .env.local (NIEMALS committen!)
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="random-32-char-string"
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## 🤖 KI-Integration

### Claude API Setup

**Library** (`lib/ai.ts`):

```typescript
import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

const model = anthropic('claude-sonnet-4-20250514')

export async function generateTrainingPlan(
  athleteProfile: AthleteProfile,
  latestMetrics: PerformanceMetric,
  feedback?: string,
  constraints?: string
) {
  const prompt = buildPrompt(athleteProfile, latestMetrics, feedback, constraints)

  const result = await generateObject({
    model,
    schema: trainingPlanSchema,
    prompt,
    temperature: 0.7
  })

  return result.object
}
```

### Prompt Engineering

**Struktur**:

```typescript
function buildPrompt(profile, metrics, feedback, constraints) {
  return `
You are an experienced triathlon coach generating a 14-day training plan.

ATHLETE CONTEXT:
- Race Date: ${profile.raceDate}
- Weeks Until Race: ${calculateWeeksUntil(profile.raceDate)}
- Goal Time: ${profile.goalTime}
- Training Phase: ${determinePhase(weeksUntilRace)}

CURRENT PERFORMANCE:
- Run Threshold Pace: ${metrics.runThresholdPace} min/km
- Run Tolerance: ${metrics.runToleranceKm} km/week
- FTP: ${metrics.ftpWatts} watts
- Swim Pace: ${metrics.swimPacePer100m} per 100m
- Training Readiness: ${metrics.trainingReadiness}/100
- Training Load: ${metrics.trainingLoad}

TRAINING RULES:
${JSON.stringify(profile.trainingRules, null, 2)}

CONSTRAINTS:
${constraints || 'None'}

LAST CYCLE FEEDBACK:
${feedback || 'First cycle, no feedback'}

CRITICAL INSTRUCTIONS:
1. Respect run tolerance (≤${metrics.runToleranceKm} km/week)
2. 80% Zone 1-2 training
3. Include ≥1 brick workout (bike→run)
4. Follow training rules strictly
5. Periodize for ${determinePhase(weeksUntilRace)} phase

OUTPUT: JSON with structure:
{
  "week1": [ { day, date, discipline, durationMinutes, intensityZone, description }, ... ],
  "week2": [ ... ],
  "rationale": "Explanation of plan focus"
}
`
}
```

### Zod Schema für Validation

```typescript
const sessionSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', /* ... */]),
  date: z.string(),
  discipline: z.enum(['RUN', 'BIKE', 'SWIM', 'GYM', 'REST']),
  durationMinutes: z.number().min(0).max(300),
  intensityZone: z.string().nullable(),
  description: z.string()
})

const trainingPlanSchema = z.object({
  week1: z.array(sessionSchema).length(7),
  week2: z.array(sessionSchema).length(7),
  rationale: z.string()
})
```

### API Kosten & Optimierung

**Claude Sonnet 4 Pricing** (Stand Nov 2025):
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

**Pro Plan-Generierung**:
- Prompt: ~2000 tokens (~$0.006)
- Response: ~1500 tokens (~$0.022)
- **Total: ~$0.028 pro Plan**

**Optimierungen**:
1. Caching von Prompts (Anthropic Prompt Caching)
2. Minimale Token-Nutzung im Prompt
3. Structured Output (verhindert Re-Tries)

---

## 🚀 Deployment & DevOps

### Deployment-Architektur

**Empfohlener Stack**:

```
Frontend + Backend: Vercel
Database: Neon (Serverless Postgres)
AI: Anthropic API (Claude)
DNS: Cloudflare (optional)
Monitoring: Vercel Analytics + Sentry (future)
```

### Environment Setup

**Entwicklung** (`.env.local`):

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/tritrainbuddy"

# Auth
BETTER_AUTH_SECRET="dev-secret-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# AI
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

**Produktion** (Vercel Environment Variables):

```bash
# Database (Neon Connection String)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Auth
BETTER_AUTH_SECRET="production-random-secret"
BETTER_AUTH_URL="https://tri-train-buddy.vercel.app"
NEXT_PUBLIC_BETTER_AUTH_URL="https://tri-train-buddy.vercel.app"

# AI
ANTHROPIC_API_KEY="sk-ant-api03-prod-..."
```

### Deployment-Workflow

**Automatisches Deployment (Vercel)**:

```bash
# 1. Git Push triggert Vercel Build
git push origin main

# 2. Vercel Build Process
- npm install
- npx prisma generate
- npm run build
- (Migrations müssen manuell laufen)

# 3. Deploy
- Preview Deployment (für branches)
- Production Deployment (für main)
```

**Manuelle Migrations**:

```bash
# Nach Schema-Änderungen
npx prisma migrate deploy
```

### Performance-Monitoring

**Vercel Analytics** (eingebaut):
- Core Web Vitals
- Response Times
- Error Rates

**Geplant für v2**:
- Sentry für Error Tracking
- Posthog für User Analytics
- Upstash Redis für Caching

---

## 📊 Architektur-Diagramme

### System-Architektur

```
┌─────────────────────────────────────────────────────────┐
│                       FRONTEND                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Next.js 15 App Router                    │  │
│  │  - Server Components (Dashboard, Plan Details)   │  │
│  │  - Client Components (Forms, Charts)             │  │
│  │  - React Hook Form + Zod Validation              │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │         API Layer (Next.js Route Handlers)       │  │
│  │  - /api/auth/* (BetterAuth)                      │  │
│  │  - /api/profile (CRUD)                           │  │
│  │  - /api/metrics (CRUD)                           │  │
│  │  - /api/plan/generate (AI Integration)          │  │
│  │  - /api/session/[id] (Updates)                  │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ↓               ↓               ↓
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Prisma   │   │  Claude  │   │ Better   │
    │  Client  │   │   API    │   │  Auth    │
    └──────────┘   └──────────┘   └──────────┘
           │
           ↓
    ┌──────────────┐
    │  PostgreSQL  │
    │   (Neon)     │
    └──────────────┘
```

### Datenfluss: Plan-Generierung

```
User clicks "Generate Plan"
         │
         ↓
    ┌─────────────────┐
    │  /plan/new      │
    │  (Client Form)  │
    └─────────────────┘
         │
         │ POST /api/plan/generate
         │ { feedback, constraints, startDate }
         ↓
    ┌─────────────────────────────────┐
    │  API Route Handler              │
    │  1. Validate Session            │
    │  2. Fetch AthleteProfile        │
    │  3. Fetch Latest Metrics        │
    └─────────────────────────────────┘
         │
         │ Call generateTrainingPlan()
         ↓
    ┌─────────────────────────────────┐
    │  lib/ai.ts                      │
    │  1. Build Prompt                │
    │  2. Call Claude API             │
    │  3. Validate with Zod Schema    │
    └─────────────────────────────────┘
         │
         │ Structured JSON Response
         ↓
    ┌─────────────────────────────────┐
    │  API Route Handler              │
    │  1. Create TrainingCycle        │
    │  2. Create 14 TrainingSessions  │
    │  3. Mark old cycles COMPLETED   │
    └─────────────────────────────────┘
         │
         │ Return { cycle, plan }
         ↓
    ┌─────────────────┐
    │  Frontend       │
    │  Redirect to    │
    │  /dashboard     │
    └─────────────────┘
```

---

## 🔮 Zukunfts-Architektur (v2.0)

### Geplante Tech-Stack-Erweiterungen

| Feature | Technologie | Grund |
|---------|-------------|-------|
| Type-safe APIs | tRPC | End-to-end Type Safety |
| Caching | Upstash Redis | Schnellere API Responses |
| Background Jobs | Inngest | Plan-Generierung async |
| Real-time Updates | Pusher/Ably | Live Dashboard |
| Mobile App | React Native + Expo | Native iOS/Android |
| Email | Resend | Benachrichtigungen |
| Calendar Sync | Google Calendar API | Export von Sessions |
| Fitness Tracker | Garmin/Strava API | Auto-Import |
| Error Tracking | Sentry | Production Monitoring |
| Analytics | Posthog | User Behavior |

---

**Version**: 2.0 Dokumentation
**Erstellt**: 14. November 2025
**Zielgruppe**: Entwickler, DevOps, Architekten
**Status**: Production-ready MVP

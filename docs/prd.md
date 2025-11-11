**Perfekt, lass uns einen knackigen PRD schreiben.**

Dein Tech-Stack ist solide. Ein paar kleine Ergänzungen:

**Tech-Stack Complete:**
```
✅ Next.js 14 (App Router)
✅ TypeScript
✅ Prisma ORM (Neon PostgreSQL)
✅ BetterAuth (Email/Password)
✅ Vercel AI SDK + AI Gateway
✅ Shadcn/ui + Tailwind CSS
✅ Vercel Deployment

Zusätzlich:
- Zod (Schema Validation)
- React Hook Form (Forms)
- date-fns (Date handling)
- Recharts (Progress Charts)
```

Haben wir nichts Kritisches vergessen. ✅

---

## PRD: Ironman Training Planner (MVP)

### **1. Product Overview**

**Name:** Ironman Training Planner (Arbeitstitel)

**Purpose:** Persönliches Trainingsplanungs-Tool für Triathlon (Ironman), das auf trainingswissenschaftlichen Prinzipien basiert und durch Claude AI individuell angepasste 14-Tage-Pläne generiert.

**Target User:** Rico (Single-User, später erweiterbar)

**Timeline:** 14 Tage bis MVP

---

### **2. Core User Flow**

```
1. Login (BetterAuth)
   ↓
2. Onboarding (einmalig)
   → Athlete Profile erstellen
   → Performance Metrics eingeben
   ↓
3. Planning Cycle (alle 14 Tage)
   → Feedback letzte 2 Wochen (optional)
   → Constraints eingeben
   → "Plan generieren" → Claude API
   → Plan Review & Anpassung (optional)
   ↓
4. Training Execution (laufend)
   → Dashboard: Nächste Einheiten
   → Einheiten abhaken
   → Notizen hinzufügen
   ↓
5. Progress Tracking
   → Übersicht absolvierte Einheiten
   → Wochenvolumen-Chart
```

---

### **3. Data Model (Prisma Schema)**

```prisma
// BetterAuth Models (via BetterAuth)
model User {
  id                String              @id @default(cuid())
  email             String              @unique
  emailVerified     Boolean             @default(false)
  name              String?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  athleteProfile    AthleteProfile?
  performanceMetrics PerformanceMetric[]
  trainingCycles    TrainingCycle[]
  sessions          Session[]
  accounts          Account[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
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
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
}

// App Models
model AthleteProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  raceDate      DateTime
  raceType      String   @default("ironman") // 'ironman', 'half-ironman', etc.
  goalTime      String   // '12:00:00'
  trainingRules Json     // { mondayRest: true, weekendLong: true, ... }
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PerformanceMetric {
  id                  String   @id @default(cuid())
  userId              String
  recordedAt          DateTime @default(now())
  runThresholdPace    String   // '5:50' (min/km)
  runToleranceKm      Int      // 26
  ftpWatts            Int      // 240
  swimPacePer100m     String   // '2:10'
  trainingReadiness   Int?     // 0-100
  trainingLoad        String?  // '214/300'
  notes               String?  @db.Text
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, recordedAt])
}

model TrainingCycle {
  id            String            @id @default(cuid())
  userId        String
  startDate     DateTime
  endDate       DateTime
  feedback      String?           @db.Text
  constraints   String?           @db.Text // "Dienstreise Mo/Di, ..."
  status        CycleStatus       @default(PLANNED)
  generatedPlan Json?             // Kompletter Claude-Output
  rationale     String?           @db.Text // Warum dieser Plan?
  createdAt     DateTime          @default(now())
  
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
  id                 String    @id @default(cuid())
  cycleId            String
  date               DateTime
  discipline         Discipline
  durationMinutes    Int
  intensityZone      String?   // 'Z1', 'Z2', 'Threshold', etc.
  description        String    @db.Text
  completed          Boolean   @default(false)
  actualNotes        String?   @db.Text
  syncedToCalendar   Boolean   @default(false)
  calendarEventId    String?
  
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

---

### **4. Pages & Routes**

```
/
  → Landing (if not logged in)
  → Redirect to /dashboard (if logged in)

/auth/login
  → Email/Password Login Form

/auth/signup
  → Disabled (Single-User MVP)

/onboarding
  → Step 1: Athlete Profile (Race Date, Goal, Rules)
  → Step 2: Initial Performance Metrics
  → → Redirect to /dashboard

/dashboard
  → Übersicht nächste 7 Tage
  → Quick Stats (aktuelle Woche: Einheiten geplant/gemacht)
  → CTA: "Nächsten Zyklus planen" (wenn nötig)

/plan/new
  → Form: Feedback letzte 2 Wochen (optional)
  → Form: Constraints nächste 2 Wochen
  → Button: "Plan generieren" (Claude API)
  → Loader → Plan Preview
  → Button: "Plan übernehmen"

/plan/[cycleId]
  → Übersicht 14-Tage-Plan
  → Kalenderansicht (2 Wochen)
  → Liste aller Einheiten
  → Abhaken, Notizen hinzufügen

/metrics
  → Aktuelle Performance Metrics
  → Form: Update Metrics (neue Zeile in DB)
  → Historie (Tabelle/Chart)

/progress
  → Chart: Wochenvolumen über Zeit (Laufen, Rad, Schwimmen)
  → Stats: Completion Rate
  → Tabelle: Vergangene Zyklen

/settings
  → Athlete Profile bearbeiten
  → Logout
```

---

### **5. API Routes**

```
POST /api/auth/[...betterauth]
  → BetterAuth Handler

POST /api/plan/generate
  → Input: { feedback, constraints, currentMetrics }
  → Claude API Call (Vercel AI SDK)
  → Output: { week1: [...], week2: [...], rationale }
  → Speichert TrainingCycle + TrainingSessions

PATCH /api/session/[id]
  → Update Session (completed, actualNotes)

GET /api/metrics/latest
  → Latest PerformanceMetric für User

POST /api/metrics
  → Create new PerformanceMetric
```

---

### **6. Claude API Integration**

**Route:** `/api/plan/generate`

**Input Structure:**
```typescript
{
  athleteProfile: {
    raceDate: '2026-07-05',
    goalTime: '12:00:00',
    trainingRules: {
      mondayRest: true,
      weekendLong: true,
      minBikePerWeek: 2,
      maxBikePerWeek: 4,
      minRunPerWeek: 2,
      maxRunPerWeek: 4,
      maxSwimPerWeek: 1,
      gymPerWeek: 2
    }
  },
  currentMetrics: {
    runThresholdPace: '5:50',
    runToleranceKm: 26,
    ftpWatts: 240,
    swimPacePer100m: '2:10',
    trainingReadiness: 75,
    trainingLoad: '214/300'
  },
  lastCycleFeedback: 'Fühlte mich gut, alle Einheiten gemacht',
  constraints: 'Dienstreise Mo/Di, Donnerstag nur kurz',
  weeksUntilRace: 34,
  currentDate: '2025-11-11'
}
```

**Prompt Template:**
```
Du bist ein erfahrener Triathlon-Coach. Erstelle einen 14-Tage-Trainingsplan...

[Strukturierter Prompt mit allen Details]

Gib zurück als JSON:
{
  "week1": [...],
  "week2": [...],
  "rationale": "Kurze Erklärung der Periodisierung"
}
```

**Output Structure:**
```typescript
{
  week1: [
    {
      day: 'Monday',
      date: '2025-11-11',
      discipline: 'REST',
      durationMinutes: 0,
      intensityZone: null,
      description: 'Ruhetag - Regeneration'
    },
    {
      day: 'Tuesday',
      date: '2025-11-12',
      discipline: 'BIKE',
      durationMinutes: 60,
      intensityZone: 'Z2',
      description: 'Rad Indoor: 60min GA1 (Zone 2, ~140-160W, locker)'
    },
    // ...
  ],
  week2: [...],
  rationale: 'Base-Building Phase: Fokus auf Grundlagenausdauer...'
}
```

---

### **7. UI Components (Shadcn)**

**Needed:**
- Button
- Card
- Form (Input, Textarea, Select, DatePicker)
- Table
- Dialog
- Tabs
- Badge
- Calendar
- Chart (Recharts)
- Checkbox
- Label
- Separator
- Skeleton (Loading States)

---

### **8. Environment Variables**

```env
# Database
DATABASE_URL="postgresql://..."

# BetterAuth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000" # or Vercel URL

# Claude AI
ANTHROPIC_API_KEY="sk-ant-..."

# Optional: Google Calendar (Phase 2)
# GOOGLE_CLIENT_ID="..."
# GOOGLE_CLIENT_SECRET="..."
```

---

### **9. MVP Feature Checklist**

**MUST HAVE (Week 1):**
- [ ] Project Setup (Next.js + Prisma + BetterAuth)
- [ ] Database Schema + Migrations
- [ ] Auth Flow (Login/Logout)
- [ ] Onboarding (Profile + Metrics)
- [ ] Dashboard (Basic)
- [ ] Plan Generation (Claude API)
- [ ] Plan Display (Table/List View)

**MUST HAVE (Week 2):**
- [ ] Session Completion (Checkboxes + Notes)
- [ ] Metrics Update Page
- [ ] Progress Page (Basic Chart)
- [ ] Styling & UX Polish
- [ ] Deployment (Vercel)

**LATER:**
- Google Calendar Sync
- Advanced Analytics
- Mobile Optimization

---

### **10. Success Criteria**

MVP ist erfolgreich wenn:
1. Rico kann sich einloggen ✅
2. Rico kann einen 14-Tage-Plan generieren ✅
3. Rico kann Einheiten abhaken ✅
4. Rico kann Metrics updaten ✅
5. Rico kann seinen Progress sehen ✅
6. App läuft stabil auf Vercel ✅

---

## **Nächster Schritt:**

Ich schreibe dir jetzt einen **Claude Code Starter-Prompt**, der diesen PRD umsetzt.

**Bereit?** Soll ich den Prompt generieren?
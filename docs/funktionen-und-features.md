# Funktionsbeschreibungen & Features - Tri-Train-Buddy

## 📋 Inhaltsverzeichnis

1. [Feature-Übersicht](#feature-übersicht)
2. [Onboarding-Prozess](#onboarding-prozess)
3. [Dashboard](#dashboard)
4. [Trainingsplan-Generierung](#trainingsplan-generierung)
5. [Trainingsplan-Ansicht](#trainingsplan-ansicht)
6. [Performance-Metriken](#performance-metriken)
7. [Fortschritt & Analytics](#fortschritt--analytics)
8. [Account-Einstellungen](#account-einstellungen)
9. [KI-Funktionalität](#ki-funktionalität)
10. [Zukünftige Features (v2.0)](#zukünftige-features-v20)

---

## 🎯 Feature-Übersicht

### Aktuelle Features (v1.0 - MVP)

| Feature | Status | Beschreibung | Priorität |
|---------|--------|--------------|-----------|
| **Authentifizierung** | ✅ Live | Email/Passwort Login mit BetterAuth | Hoch |
| **Onboarding-Wizard** | ✅ Live | 2-Schritt Setup für neue Nutzer | Hoch |
| **KI-Trainingsplan** | ✅ Live | 14-Tage-Zyklen mit Claude AI | Hoch |
| **Dashboard** | ✅ Live | Übersicht nächster 7 Tage | Hoch |
| **Plan-Detailansicht** | ✅ Live | Vollständiger 14-Tage-Plan | Hoch |
| **Session-Completion** | ✅ Live | Einheiten abhaken + Notizen | Mittel |
| **Metriken-Tracking** | ✅ Live | Leistungsdaten aktualisieren | Mittel |
| **Fortschritts-Charts** | ✅ Live | Wöchentliche Volumen-Statistik | Mittel |
| **Account-Settings** | ✅ Live | Profil bearbeiten, Logout | Niedrig |

### Roadmap Features (v2.0)

| Feature | Status | Beschreibung | Priorität |
|---------|--------|--------------|-----------|
| **Kalender-Export** | 📅 Geplant | Google Calendar Integration | Hoch |
| **Geräte-Sync** | 📅 Geplant | Garmin/Strava Auto-Import | Hoch |
| **E-Mail-Benachrichtigungen** | 📅 Geplant | Training-Erinnerungen | Mittel |
| **Mobile App** | 📅 Geplant | React Native iOS/Android | Mittel |
| **Ernährungsplanung** | 💡 Idee | Makro-Empfehlungen | Niedrig |
| **Community** | 💡 Idee | Pläne teilen, Leaderboards | Niedrig |

---

## 🚀 Onboarding-Prozess

### Übersicht

**Ziel**: Neue Nutzer in unter 10 Minuten einsatzbereit machen

**Flow**:
```
Login → Onboarding Check → Schritt 1 (Profil) → Schritt 2 (Metriken) → Dashboard
```

### Schritt 1: Athletenprofil

**Route**: `/onboarding` (Schritt 1 von 2)

**Zweck**: Wettkampfziele und Trainingsregeln erfassen

#### Formularfelder

##### 1. **Race Date** (Pflichtfeld)
- **Typ**: Date Picker
- **Validierung**: Muss in der Zukunft liegen
- **Beispiel**: `2026-07-05` (Ironman Hamburg)
- **Verwendung**: Berechnung der Trainingsphase (Base/Build/Peak/Taper)

##### 2. **Goal Time** (Pflichtfeld)
- **Typ**: Text Input (Format: HH:MM:SS)
- **Validierung**: Regex `^\d{2}:\d{2}:\d{2}$`
- **Beispiel**: `12:00:00` (12 Stunden)
- **Verwendung**: Intensitäts-Zonen berechnen

##### 3. **Training Rules** (Pflichtfelder)

| Feld | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `mondayRest` | Checkbox | `true` | Montag immer Ruhetag? |
| `weekendLong` | Checkbox | `true` | Lange Einheiten am Wochenende? |
| `minBikePerWeek` | Number (1-7) | `2` | Minimum Radeinheiten/Woche |
| `maxBikePerWeek` | Number (1-7) | `4` | Maximum Radeinheiten/Woche |
| `minRunPerWeek` | Number (1-7) | `2` | Minimum Laufeinheiten/Woche |
| `maxRunPerWeek` | Number (1-7) | `4` | Maximum Laufeinheiten/Woche |
| `maxSwimPerWeek` | Number (0-7) | `1` | Maximum Schwimmeinheiten/Woche |
| `gymPerWeek` | Number (0-7) | `2` | Krafttraining-Einheiten/Woche |

**Beispiel JSON-Struktur** (gespeichert in DB):
```json
{
  "mondayRest": true,
  "weekendLong": true,
  "minBikePerWeek": 2,
  "maxBikePerWeek": 4,
  "minRunPerWeek": 2,
  "maxRunPerWeek": 4,
  "maxSwimPerWeek": 1,
  "gymPerWeek": 2
}
```

#### Validierung

**Client-Side** (React Hook Form + Zod):
```typescript
const profileSchema = z.object({
  raceDate: z.string().refine(date => new Date(date) > new Date(), {
    message: "Race date must be in the future"
  }),
  goalTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, {
    message: "Format: HH:MM:SS (e.g., 12:00:00)"
  }),
  trainingRules: z.object({
    mondayRest: z.boolean(),
    // ... rest
  })
})
```

**Server-Side**: Zusätzliche Validierung in API Route

#### User Experience

1. **Auto-Save Draft** (future): LocalStorage für unvollständige Formulare
2. **Progress Indicator**: "Schritt 1 von 2" Anzeige
3. **Help Tooltips**: "?" Icons mit Erklärungen
4. **Mobile-Optimized**: Touch-freundliche Inputs

---

### Schritt 2: Performance-Metriken

**Route**: `/onboarding` (Schritt 2 von 2)

**Zweck**: Aktuelle Fitness-Level erfassen für personalisierten Plan

#### Formularfelder

##### 1. **Run Threshold Pace** (Pflichtfeld)
- **Typ**: Text Input (Format: MM:SS)
- **Validierung**: Regex `^\d{1,2}:\d{2}$`
- **Beispiel**: `5:50` (5 Minuten 50 Sekunden pro Kilometer)
- **Erklärung**: "Deine Pace für 10 km Wettkampf oder FTP-Test"
- **Verwendung**: Berechnung der Trainingszonen für Laufeinheiten

##### 2. **Run Tolerance** (Pflichtfeld)
- **Typ**: Number Slider (1-300 km)
- **Beispiel**: `50` km/Woche
- **Erklärung**: "Maximale Laufkilometer pro Woche ohne Verletzungsrisiko"
- **Verwendung**: **Kritisch!** Verhindert Übertraining, KI hält dieses Limit ein

##### 3. **FTP Watts** (Pflichtfeld)
- **Typ**: Number Input (50-500 Watt)
- **Beispiel**: `200` Watt
- **Erklärung**: "Functional Threshold Power - Power, die du 1h halten kannst"
- **Test-Anleitung**: "20-Min-Test auf Rolle: Durchschnitts-Watt × 0,95"
- **Verwendung**: Berechnung der Trainingszonen für Radeinheiten

##### 4. **Swim Pace per 100m** (Pflichtfeld)
- **Typ**: Text Input (Format: MM:SS)
- **Beispiel**: `2:10` (2 Minuten 10 Sekunden)
- **Erklärung**: "Deine CSS (Critical Swim Speed) für 400m Test"
- **Verwendung**: Berechnung der Trainingszonen für Schwimmeinheiten

##### 5. **Training Readiness** (Optional)
- **Typ**: Slider (0-100)
- **Beispiel**: `75`
- **Erklärung**: "Wie fühlst du dich heute? (Müdigkeit, Motivation, Stress)"
- **Verwendung**: KI kann Volumen anpassen bei niedrigen Werten

##### 6. **Training Load** (Optional)
- **Typ**: Text Input (Format: "current/max")
- **Beispiel**: `214/300`
- **Erklärung**: "Aktuelle vs. maximale Trainingsbelastung (z.B. aus Garmin/Polar)"
- **Verwendung**: Verhindert Übertraining

##### 7. **Notes** (Optional)
- **Typ**: Textarea
- **Beispiel**: "Knie-Probleme letzte Woche, vorsichtig steigern"
- **Verwendung**: KI berücksichtigt bei Planerstellung

#### Validierung

```typescript
const metricsSchema = z.object({
  runThresholdPace: z.string().regex(/^\d{1,2}:\d{2}$/),
  runToleranceKm: z.number().min(1).max(300),
  ftpWatts: z.number().min(50).max(500),
  swimPacePer100m: z.string().regex(/^\d{1,2}:\d{2}$/),
  trainingReadiness: z.number().min(0).max(100).optional(),
  trainingLoad: z.string().optional(),
  notes: z.string().max(1000).optional()
})
```

#### Nach Abschluss

**Erfolgs-Flow**:
1. Daten in DB speichern (POST `/api/profile` + POST `/api/metrics`)
2. Redirect zu `/dashboard`
3. Toast-Benachrichtigung: "Profil erfolgreich erstellt! Jetzt ersten Plan generieren."
4. Call-to-Action: "Neuen Trainingsplan erstellen" Button

---

## 📊 Dashboard

### Übersicht

**Route**: `/dashboard`

**Zweck**: Zentrale Anlaufstelle für tägliche Training-Übersicht

**Rendering**: Server-Side (Next.js Server Component)

### Layout-Struktur

```
┌─────────────────────────────────────────────────┐
│  Navigation Bar                                  │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ This Week   │ │ Active Cycle│ │ Next      │ │
│  │ 5/7 (71%)   │ │ Week 1 of 2 │ │ Action    │ │
│  └─────────────┘ └─────────────┘ └───────────┘ │
├─────────────────────────────────────────────────┤
│  Next 7 Days                                     │
│  ┌───────────────────────────────────────────┐  │
│  │ Monday, Nov 11                            │  │
│  │ 🧘 REST | Complete rest day               │  │
│  ├───────────────────────────────────────────┤  │
│  │ Tuesday, Nov 12                           │  │
│  │ 🏃 RUN | 60 Min | Zone 2                  │  │
│  │ 10min warm-up, 40min easy...   [✓ Done]  │  │
│  ├───────────────────────────────────────────┤  │
│  │ Wednesday, Nov 13                         │  │
│  │ 🚴 BIKE | 90 Min | Zone 2                 │  │
│  │ Long endurance ride...   [ Mark Complete] │  │
│  └───────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  [View Full Training Cycle] [Generate New Plan] │
└─────────────────────────────────────────────────┘
```

### Komponenten

#### 1. **Stats Cards** (3-Spalten-Grid)

**Card 1: This Week**
- **Metric**: Completion Rate
- **Berechnung**: `completedSessions / totalSessionsThisWeek × 100`
- **Beispiel**: "5 of 7 (71%)"
- **Styling**: Grüner Badge wenn >70%, Gelb 40-70%, Rot <40%

**Card 2: Active Cycle**
- **Metric**: Aktueller Zyklus
- **Berechnung**: `Week X of 2`, Datumsbereich
- **Beispiel**: "Week 1 of 2 (Nov 11 - Nov 24)"
- **Logik**: Zeigt nur wenn `status = 'ACTIVE'`

**Card 3: Next Action**
- **Metric**: Nächste anstehende Einheit
- **Berechnung**: Erste uncompleted Session >= heute
- **Beispiel**: "🏃 Run on Wednesday"
- **Styling**: Disziplin-Icon mit Farbe

#### 2. **Next 7 Days Sessions**

**Datenquelle**:
```typescript
const sessions = await prisma.trainingSession.findMany({
  where: {
    cycle: {
      userId: session.user.id,
      status: 'ACTIVE'
    },
    date: {
      gte: new Date(), // Heute oder später
      lte: addDays(new Date(), 7) // Nächste 7 Tage
    }
  },
  orderBy: { date: 'asc' }
})
```

**Session-Card-Layout**:

```tsx
<Card>
  <Date>Monday, Nov 11</Date>
  <Badge color={disciplineColor}>🏃 RUN</Badge>
  <Duration>60 Min</Duration>
  <IntensityZone>Zone 2</IntensityZone>
  <Description>
    10min warmup at easy pace, 40min at 6:20/km, 10min cool down
  </Description>
  <CompletionButton />
</Card>
```

**Completion-Button**:
- **Uncompleted**: "Mark as Complete" (Checkbox leer)
- **Completed**: "✓ Done" (Checkbox grün, Card hat grünen Border)
- **Action**: PATCH `/api/session/[id]` mit `{ completed: true }`

#### 3. **Action Buttons**

**Logik**:
```typescript
if (noActiveCycle) {
  return <Button>Generate New Training Plan</Button>
} else {
  return (
    <>
      <Button variant="outline">View Full Cycle</Button>
      <Button>Generate New Plan</Button>
    </>
  )
}
```

### Edge Cases

**1. Kein aktiver Zyklus**
- Stats Cards zeigen "No active cycle"
- Großer CTA: "Get started - Generate your first plan"

**2. Keine Sessions in nächsten 7 Tagen**
- Zeige: "No sessions scheduled in the next 7 days"
- Hint: "Your current cycle may be ending soon"

**3. Onboarding nicht abgeschlossen**
- Redirect zu `/onboarding`
- Check in Server Component

---

## 🤖 Trainingsplan-Generierung

### Übersicht

**Route**: `/plan/new`

**Zweck**: Neuen 14-Tage-Zyklus mit KI erstellen

**API**: `POST /api/plan/generate`

### User Interface

**Formular-Felder**:

#### 1. **Start Date** (Optional)
- **Default**: Heute
- **Typ**: Date Picker
- **Beispiel**: `2025-11-11`
- **Verwendung**: Wann soll der Plan starten?

#### 2. **Feedback from Last Cycle** (Optional)
- **Typ**: Textarea (max 500 Zeichen)
- **Placeholder**:
  ```
  "Letzer Zyklus war super, könnte etwas mehr sein"
  "Zu hart, hatte Knieprobleme nach langen Läufen"
  "Perfekt, weiter so!"
  ```
- **Verwendung**: KI passt Volumen/Intensität an

#### 3. **Constraints** (Optional)
- **Typ**: Textarea (max 500 Zeichen)
- **Placeholder**:
  ```
  "15.-17. November Geschäftsreise, nur Indoor möglich"
  "20. November Radrennen geplant"
  "Schulferien 20.-24. Nov, maximal flexibel"
  ```
- **Verwendung**: KI vermeidet lange Einheiten an diesen Tagen

**Submit-Button**: "Generate Training Plan" (mit Loading-State)

### Backend-Prozess

#### Schritt 1: Validierung

```typescript
// 1. Session Check
const session = await auth.api.getSession({ headers })
if (!session) return 401

// 2. Profile Check
const profile = await prisma.athleteProfile.findUnique({
  where: { userId: session.user.id }
})
if (!profile) return 404 "Please complete onboarding first"

// 3. Metrics Check
const metrics = await prisma.performanceMetric.findFirst({
  where: { userId: session.user.id },
  orderBy: { recordedAt: 'desc' }
})
if (!metrics) return 404 "Please add performance metrics first"
```

#### Schritt 2: KI-Prompt-Erstellung

**Prompt-Komponenten**:

1. **Athleten-Kontext**
   - Race Date: `2026-07-05`
   - Weeks Until Race: `34` (berechnet)
   - Phase: `Base` (berechnet aus Wochen)
   - Goal Time: `12:00:00`

2. **Aktuelle Leistung**
   - Run Threshold: `5:50 min/km`
   - Run Tolerance: `50 km/week`
   - FTP: `200 watts`
   - Swim Pace: `2:10 per 100m`
   - Readiness: `75/100`
   - Load: `214/300`

3. **Trainingsregeln**
   - Monday Rest: `true`
   - Bike: `2-4x/week`
   - Run: `2-4x/week`
   - Swim: `max 1x/week`
   - Gym: `2x/week`

4. **Constraints & Feedback**
   - User-provided Strings

**Trainingsphase-Logik**:

```typescript
function determinePhase(weeksUntilRace: number): string {
  if (weeksUntilRace < 4) return "Taper"
  if (weeksUntilRace < 8) return "Peak"
  if (weeksUntilRace < 16) return "Build"
  return "Base"
}
```

**Phasen-Charakteristika**:

| Phase | Wochen | Fokus | Volumen | Intensität |
|-------|--------|-------|---------|------------|
| **Base** | 16+ | Grundlagenausdauer | Hoch | Niedrig (80% Z1-2) |
| **Build** | 8-16 | Belastungssteigerung | Sehr Hoch | Mittel (70% Z1-2, 20% Z3, 10% Threshold) |
| **Peak** | 4-8 | Wettkampfspezifisch | Hoch | Hoch (Intervalle, Tempo) |
| **Taper** | 0-4 | Erholung vor Wettkampf | Reduziert (-30-50%) | Niedrig, wenige Intensitäten |

#### Schritt 3: Claude API Call

```typescript
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const result = await generateObject({
  model: anthropic('claude-sonnet-4-20250514'),
  schema: trainingPlanSchema, // Zod Schema
  prompt: fullPrompt,
  temperature: 0.7 // Kreativität vs. Konsistenz
})
```

**Schema-Struktur**:

```typescript
const trainingPlanSchema = z.object({
  week1: z.array(z.object({
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday',
                 'Friday', 'Saturday', 'Sunday']),
    date: z.string(),
    discipline: z.enum(['RUN', 'BIKE', 'SWIM', 'GYM', 'REST']),
    durationMinutes: z.number().min(0).max(300),
    intensityZone: z.string().nullable(),
    description: z.string()
  })).length(7),
  week2: z.array(/* same */).length(7),
  rationale: z.string()
})
```

#### Schritt 4: Datenbank-Speicherung

```typescript
// 1. Create Training Cycle
const cycle = await prisma.trainingCycle.create({
  data: {
    userId: session.user.id,
    startDate: new Date(startDate),
    endDate: addDays(new Date(startDate), 14),
    status: 'ACTIVE',
    feedback: feedback || null,
    constraints: constraints || null,
    generatedPlan: result.object, // Full JSON
    rationale: result.object.rationale
  }
})

// 2. Create 14 Training Sessions
const sessionsData = [
  ...result.object.week1.map((s, i) => ({
    cycleId: cycle.id,
    date: addDays(new Date(startDate), i),
    discipline: s.discipline,
    durationMinutes: s.durationMinutes,
    intensityZone: s.intensityZone,
    description: s.description,
    completed: false
  })),
  ...result.object.week2.map((s, i) => ({
    cycleId: cycle.id,
    date: addDays(new Date(startDate), 7 + i),
    // ... same
  }))
]

await prisma.trainingSession.createMany({
  data: sessionsData
})

// 3. Mark old active cycles as COMPLETED
await prisma.trainingCycle.updateMany({
  where: {
    userId: session.user.id,
    status: 'ACTIVE',
    id: { not: cycle.id }
  },
  data: { status: 'COMPLETED' }
})
```

#### Schritt 5: Response

```json
{
  "cycle": {
    "id": "clx1y2z3...",
    "startDate": "2025-11-11T00:00:00Z",
    "endDate": "2025-11-24T23:59:59Z",
    "status": "ACTIVE",
    "rationale": "Base-building phase focuses on..."
  },
  "plan": {
    "week1": [ /* 7 sessions */ ],
    "week2": [ /* 7 sessions */ ],
    "rationale": "..."
  }
}
```

### Frontend-Handling

**Loading-State**:
```tsx
const [isGenerating, setIsGenerating] = useState(false)

async function handleSubmit(data) {
  setIsGenerating(true)
  try {
    const res = await fetch('/api/plan/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    const plan = await res.json()
    router.push('/dashboard') // Redirect
    toast.success('Training plan generated!')
  } catch (error) {
    toast.error('Failed to generate plan')
  } finally {
    setIsGenerating(false)
  }
}
```

**Error-Handling**:
- 401 → Redirect to Login
- 404 → "Please complete onboarding" Toast
- 500 → "AI service unavailable, try again"

---

## 📅 Trainingsplan-Ansicht

### Übersicht

**Route**: `/plan/[cycleId]`

**Zweck**: Vollständige Ansicht aller 14 Trainingstage

**Rendering**: Server-Side

### Data Fetching

```typescript
const cycle = await prisma.trainingCycle.findUnique({
  where: { id: params.cycleId },
  include: {
    sessions: {
      orderBy: { date: 'asc' }
    }
  }
})

// Security: Verify ownership
if (cycle.userId !== session.user.id) {
  redirect('/dashboard')
}
```

### UI-Struktur

#### 1. **Cycle Header**

```tsx
<div>
  <h1>Training Cycle</h1>
  <DateRange>
    Nov 11, 2025 - Nov 24, 2025
  </DateRange>
  <Button>Generate New Cycle</Button>
</div>
```

#### 2. **Rationale Card**

```tsx
<Card>
  <CardHeader>Why This Plan?</CardHeader>
  <CardContent>
    {cycle.rationale}
    {/* Example: "Base-building phase (34 weeks until race).
         Focus on aerobic foundation with 80% Zone 1-2 training..." */}
  </CardContent>
</Card>
```

#### 3. **Week 1 Card**

**Layout**:
```tsx
<Card>
  <CardHeader>Week 1 (Nov 11 - Nov 17)</CardHeader>
  <CardContent>
    {week1Sessions.map(session => (
      <SessionCard
        key={session.id}
        session={session}
        onComplete={handleComplete}
      />
    ))}
  </CardContent>
</Card>
```

**Session Card Komponente**:

```tsx
<div className={completed ? 'bg-green-50' : ''}>
  {/* Header */}
  <div className="flex justify-between">
    <div>
      <span className="font-bold">{session.day}</span>
      <span className="text-gray-500">
        {format(session.date, 'MMM d')}
      </span>
    </div>
    <Badge color={getDisciplineColor(session.discipline)}>
      {getDisciplineIcon(session.discipline)} {session.discipline}
    </Badge>
  </div>

  {/* Details */}
  <div>
    <span>{session.durationMinutes} Min</span>
    {session.intensityZone && (
      <Badge variant="outline">{session.intensityZone}</Badge>
    )}
  </div>

  {/* Description */}
  <p className="text-sm">{session.description}</p>

  {/* Completion */}
  <form action={completeSessionAction}>
    <Checkbox
      checked={session.completed}
      onChange={handleToggle}
    />
    <Label>Mark as Complete</Label>

    {session.completed && (
      <Textarea
        placeholder="Optional notes about this session..."
        defaultValue={session.actualNotes}
        onBlur={handleNotesUpdate}
      />
    )}
  </form>
</div>
```

**Disziplin-Icons & Farben**:

```typescript
const disciplineConfig = {
  RUN: { icon: '🏃', color: 'blue' },
  BIKE: { icon: '🚴', color: 'green' },
  SWIM: { icon: '🏊', color: 'cyan' },
  GYM: { icon: '💪', color: 'purple' },
  REST: { icon: '🧘', color: 'gray' }
}
```

#### 4. **Week 2 Card**

Identische Struktur wie Week 1, nur mit Sessions 8-14

### Interaktionen

#### **Session Completion**

**Client-Side** (Optimistic Update):

```tsx
async function handleComplete(sessionId: string) {
  // 1. Optimistic UI Update
  setSession(prev => ({ ...prev, completed: !prev.completed }))

  // 2. API Call
  try {
    await fetch(`/api/session/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !session.completed })
    })
  } catch (error) {
    // 3. Revert on error
    setSession(prev => ({ ...prev, completed: !prev.completed }))
    toast.error('Failed to update session')
  }
}
```

**Server-Side**:

```typescript
// src/app/api/session/[id]/route.ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  const body = await req.json()

  // Verify ownership
  const trainingSession = await prisma.trainingSession.findUnique({
    where: { id: params.id },
    include: { cycle: true }
  })

  if (trainingSession.cycle.userId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Update
  const updated = await prisma.trainingSession.update({
    where: { id: params.id },
    data: {
      completed: body.completed,
      actualNotes: body.actualNotes
    }
  })

  return NextResponse.json(updated)
}
```

---

## 📈 Performance-Metriken

### Übersicht

**Route**: `/metrics`

**Zweck**: Leistungsdaten aktualisieren für zukünftige Pläne

**API**: `POST /api/metrics`

### UI-Struktur

#### 1. **Current Metrics Card**

Zeigt neueste Metriken an (read-only):

```tsx
<Card>
  <CardHeader>Your Current Metrics</CardHeader>
  <CardContent>
    <MetricDisplay
      label="Run Threshold Pace"
      value="5:50 min/km"
      recordedAt="Nov 10, 2025"
    />
    <MetricDisplay
      label="FTP"
      value="200 watts"
      recordedAt="Nov 10, 2025"
    />
    {/* ... rest */}
  </CardContent>
</Card>
```

#### 2. **Update Metrics Form**

**Identische Felder wie Onboarding Step 2** (siehe oben)

**Pre-Fill Logic**:

```tsx
const { data: latestMetrics } = useQuery({
  queryKey: ['metrics', 'latest'],
  queryFn: async () => {
    const res = await fetch('/api/metrics/latest')
    return res.json()
  }
})

// Pre-fill form with latest values
useEffect(() => {
  if (latestMetrics) {
    form.reset({
      runThresholdPace: latestMetrics.runThresholdPace,
      runToleranceKm: latestMetrics.runToleranceKm,
      // ... rest
    })
  }
}, [latestMetrics])
```

#### 3. **Metrics History**

**Tabelle mit letzten 10 Einträgen**:

| Recorded At | Run Pace | FTP | Swim Pace | Readiness | Actions |
|-------------|----------|-----|-----------|-----------|---------|
| Nov 10, 2025 | 5:50 | 200W | 2:10 | 75 | 👁️ View |
| Oct 27, 2025 | 5:55 | 195W | 2:15 | 70 | 👁️ View |
| ... | ... | ... | ... | ... | ... |

**"View" Modal**:
- Zeigt alle Details inkl. Notes
- Optional: "Use these metrics" Button (pre-fill form)

### Datenbank-Query

```typescript
// GET /api/metrics
const metrics = await prisma.performanceMetric.findMany({
  where: { userId: session.user.id },
  orderBy: { recordedAt: 'desc' },
  take: 10
})
```

### Warum Metriken-Historie wichtig ist

1. **Fortschritt tracken**: Sehe Verbesserung über Zeit
2. **KI-Personalisierung**: Zukünftige AI könnte Trends erkennen
3. **Rollback**: Bei Verletzung alte Werte wiederherstellen
4. **Analyse**: Korrelation zwischen Metriken und Plan-Erfolg

---

## 📊 Fortschritt & Analytics

### Übersicht

**Route**: `/progress`

**Zweck**: Visualisierung des Trainingsfortschritts

**API**: `GET /api/progress`

### UI-Komponenten

#### 1. **Summary Stats** (3 Cards)

**Card 1: Completion Rate**
```tsx
<StatCard
  title="Overall Completion"
  value="85%"
  description="34 of 40 sessions completed"
  trend="+5% from last month"
/>
```

**Card 2: Current Streak**
```tsx
<StatCard
  title="Current Streak"
  value="7 days"
  description="Keep it up!"
/>
```

**Card 3: Total Volume (This Month)**
```tsx
<StatCard
  title="Monthly Volume"
  value="18 hours"
  description="Run: 6h, Bike: 9h, Swim: 3h"
/>
```

#### 2. **Weekly Volume Chart** (Recharts)

**Datenstruktur**:

```typescript
const weeklyData = [
  {
    week: "Nov 4",
    run: 180,    // minutes
    bike: 240,
    swim: 60,
    total: 480
  },
  {
    week: "Nov 11",
    run: 200,
    bike: 270,
    swim: 45,
    total: 515
  },
  // ... last 8 weeks
]
```

**Chart-Komponente**:

```tsx
<BarChart data={weeklyData} width={800} height={400}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="week" />
  <YAxis label={{ value: 'Minutes', angle: -90 }} />
  <Tooltip />
  <Legend />
  <Bar dataKey="run" fill="#3b82f6" name="Run" />
  <Bar dataKey="bike" fill="#10b981" name="Bike" />
  <Bar dataKey="swim" fill="#06b6d4" name="Swim" />
</BarChart>
```

#### 3. **Discipline Breakdown** (Pie Chart)

Prozentuale Verteilung der Disziplinen über letzten Monat:

```tsx
<PieChart width={400} height={400}>
  <Pie
    data={[
      { name: 'Run', value: 360, fill: '#3b82f6' },
      { name: 'Bike', value: 540, fill: '#10b981' },
      { name: 'Swim', value: 120, fill: '#06b6d4' },
      { name: 'Gym', value: 180, fill: '#8b5cf6' }
    ]}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    label
  />
</PieChart>
```

### Backend-Berechnung

**API Route** (`/api/progress`):

```typescript
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })

  // 1. Get all completed sessions
  const completedSessions = await prisma.trainingSession.findMany({
    where: {
      cycle: {
        userId: session.user.id
      },
      completed: true
    },
    include: { cycle: true }
  })

  // 2. Calculate total stats
  const totalSessions = await prisma.trainingSession.count({
    where: { cycle: { userId: session.user.id } }
  })
  const completionRate = (completedSessions.length / totalSessions) * 100

  // 3. Group by week
  const weeklyVolumes = completedSessions.reduce((acc, session) => {
    const weekStart = startOfWeek(new Date(session.date))
    const weekKey = format(weekStart, 'MMM d')

    if (!acc[weekKey]) {
      acc[weekKey] = { week: weekKey, run: 0, bike: 0, swim: 0, gym: 0 }
    }

    acc[weekKey][session.discipline.toLowerCase()] += session.durationMinutes

    return acc
  }, {})

  // 4. Sort and limit to last 8 weeks
  const sortedWeeks = Object.values(weeklyVolumes)
    .sort((a, b) => new Date(a.week) - new Date(b.week))
    .slice(-8)

  return NextResponse.json({
    totalSessions,
    completedSessions: completedSessions.length,
    completionRate,
    weeklyVolumes: sortedWeeks
  })
}
```

---

## ⚙️ Account-Einstellungen

### Übersicht

**Route**: `/settings`

**Zweck**: Profil bearbeiten, Logout

### UI-Struktur

#### 1. **User Profile Section**

```tsx
<Card>
  <CardHeader>Your Profile</CardHeader>
  <CardContent>
    {/* Avatar */}
    <Avatar>
      {user.image ? (
        <img src={user.image} alt={user.name} />
      ) : (
        <span>{getInitials(user.name)}</span>
      )}
    </Avatar>

    {/* Name (editable) */}
    <div>
      <Label>Name</Label>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleUpdateName}
      />
    </div>

    {/* Email (read-only) */}
    <div>
      <Label>Email</Label>
      <Input value={user.email} disabled />
    </div>

    {/* Metadata */}
    <div>
      <p>Member Since: {format(user.createdAt, 'PPP')}</p>
      <p>Email Verified: {user.emailVerified ? '✅' : '❌'}</p>
    </div>
  </CardContent>
</Card>
```

**Update Name API**:

```typescript
// PATCH /api/user/update
async function handleUpdateName() {
  const res = await fetch('/api/user/update', {
    method: 'PATCH',
    body: JSON.stringify({ name })
  })
  if (res.ok) {
    toast.success('Name updated!')
  }
}
```

#### 2. **Training Settings**

**Quick Links zu anderen Seiten**:

```tsx
<Card>
  <CardHeader>Training Settings</CardHeader>
  <CardContent>
    <LinkButton href="/onboarding">
      Update Athlete Profile
    </LinkButton>
    <LinkButton href="/metrics">
      Update Performance Metrics
    </LinkButton>
    <LinkButton href="/plan/new">
      Generate New Training Cycle
    </LinkButton>
  </CardContent>
</Card>
```

#### 3. **Danger Zone**

```tsx
<Card className="border-red-500">
  <CardHeader>Danger Zone</CardHeader>
  <CardContent>
    <Button
      variant="destructive"
      onClick={handleLogout}
    >
      Sign Out
    </Button>
  </CardContent>
</Card>
```

**Logout Logic**:

```tsx
import { signOut } from '@/lib/auth-client'

async function handleLogout() {
  await signOut()
  router.push('/login')
}
```

---

## 🤖 KI-Funktionalität (Detailliert)

### Trainingsplan-Logik

#### 1. **Zone-Berechnung**

**Lauf-Zonen** (basierend auf Threshold Pace):

```typescript
function calculateRunZones(thresholdPace: string): RunZones {
  const thresholdSeconds = paceToSeconds(thresholdPace) // 5:50 → 350s

  return {
    Z1: secondsToPace(thresholdSeconds * 1.25), // 7:18/km
    Z2: secondsToPace(thresholdSeconds * 1.15), // 6:42/km
    Z3: secondsToPace(thresholdSeconds * 1.05), // 6:08/km
    Threshold: thresholdPace,                   // 5:50/km
    VO2Max: secondsToPace(thresholdSeconds * 0.95) // 5:32/km
  }
}
```

**Rad-Zonen** (basierend auf FTP):

```typescript
function calculateBikeZones(ftp: number): BikeZones {
  return {
    Z1: { min: 0, max: Math.round(ftp * 0.55) },       // 0-110W
    Z2: { min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75) }, // 112-150W
    Z3: { min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90) }, // 152-180W
    Z4: { min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05) }, // 182-210W
    Z5: { min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20) }  // 212-240W
  }
}
```

#### 2. **Volumen-Berechnung**

**Run Tolerance Check** (kritisch!):

```typescript
function checkRunTolerance(
  sessions: TrainingSession[],
  toleranceKm: number
): boolean {
  const runSessions = sessions.filter(s => s.discipline === 'RUN')

  // Assume average pace of threshold + 1 min/km for volume calculation
  const totalMinutes = runSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const estimatedKm = totalMinutes / 6 // Assuming ~6 min/km average

  return estimatedKm <= toleranceKm
}
```

**KI-Instruktion im Prompt**:
```
CRITICAL: Total weekly run volume must not exceed {runToleranceKm} km.
Calculate conservatively: assume 6 min/km average pace.
Example: 50 km limit = max 300 minutes running per week.
```

#### 3. **Brick Workout Detection**

KI wird instruiert, mindestens 1 Brick-Workout pro Zyklus einzuplanen:

```
Include at least one brick workout (Bike immediately followed by Run).
Format:
- Day X: BIKE, 90 min, Z2, "Long endurance ride, prepare for transition"
- Day X: RUN, 30 min, Z2, "Brick run off bike, focus on finding rhythm"
```

**Validation im Code**:

```typescript
function validateBrickWorkout(sessions: TrainingSession[]): boolean {
  for (let i = 0; i < sessions.length - 1; i++) {
    if (
      sessions[i].discipline === 'BIKE' &&
      sessions[i + 1].discipline === 'RUN' &&
      isSameDay(sessions[i].date, sessions[i + 1].date)
    ) {
      return true
    }
  }
  return false
}
```

#### 4. **Periodisierung-Details**

**Base Phase** (16+ Wochen):
- Volumen: Hoch (12-15 Stunden/Woche)
- Intensität: 80% Z1-2, 15% Z3, 5% Threshold
- Fokus: Aerobe Basis, Technik, Kraft
- Beispiel-Woche:
  - Mo: Rest
  - Di: Run 60 min Z2
  - Mi: Bike 90 min Z2
  - Do: Swim 45 min + Gym
  - Fr: Run 45 min Z2
  - Sa: Bike 120 min Z2 (long)
  - So: Run 90 min Z1-2 (long)

**Build Phase** (8-16 Wochen):
- Volumen: Sehr Hoch (15-18 Stunden/Woche)
- Intensität: 70% Z1-2, 20% Z3, 10% Threshold/VO2Max
- Fokus: Belastungssteigerung, Tempoarbeit
- Beispiel-Woche:
  - Mo: Rest
  - Di: Run 60 min mit 3×10 min Z3
  - Mi: Bike 90 min Z2
  - Do: Swim 45 min Intervals + Gym
  - Fr: Brick: Bike 90 min Z2 → Run 30 min Z2
  - Sa: Bike 150 min Z2 (very long)
  - So: Run 120 min Z1-2 (very long)

**Peak Phase** (4-8 Wochen):
- Volumen: Hoch (13-16 Stunden/Woche)
- Intensität: 60% Z1-2, 25% Z3, 15% Threshold/Race Pace
- Fokus: Wettkampf-Simulation, Race Pace
- Beispiel-Woche:
  - Mo: Rest
  - Di: Run 60 min mit 20 min Race Pace
  - Mi: Bike 90 min mit 3×15 min Z4
  - Do: Swim 60 min Race Pace Sets + Gym
  - Fr: Easy Run 45 min Z1
  - Sa: Brick: Bike 120 min (60 min Z2, 60 min Z3) → Run 60 min Z2-3
  - So: Run 90 min mit 30 min Race Pace

**Taper Phase** (0-4 Wochen):
- Volumen: Reduziert (-30-50%)
- Intensität: Niedrig, wenige kurze Intensitäten zum "Schärfen"
- Fokus: Erholung, Frische für Wettkampf
- Beispiel-Woche:
  - Mo: Rest
  - Di: Run 40 min Z2 mit 5 min Race Pace
  - Mi: Bike 60 min Z2
  - Do: Swim 30 min easy + light gym
  - Fr: Rest
  - Sa: Easy Run 30 min Z1
  - So: Rest or very light swim

---

## 🔮 Zukünftige Features (v2.0)

### 1. **Google Calendar Integration**

**Feature**: Automatischer Export von Trainingseinheiten

**Flow**:
```
1. User klickt "Connect Google Calendar" in Settings
2. OAuth2-Flow mit Google
3. Bei neuer Plan-Generierung: Events erstellen
4. Bei Session-Completion: Event als "completed" markieren
```

**Tech Stack**:
- `@googleapis/calendar` Package
- OAuth2 mit `next-auth` (oder BetterAuth OAuth Plugin)
- Webhook für Sync (Upstash QStash)

**Datenmodell-Erweiterung**:
```prisma
model TrainingSession {
  // ... existing fields
  syncedToCalendar Boolean @default(false)
  calendarEventId  String?
}
```

---

### 2. **Garmin/Strava Integration**

**Feature**: Auto-Import abgeschlossener Trainings

**Flow**:
```
1. User verbindet Garmin Connect Account
2. Webhook erhält Activity-Updates
3. System matched Activity zu TrainingSession (Datum + Disziplin)
4. Automatisches "Mark as Complete" + Import von:
   - Tatsächliche Dauer
   - Durchschnitts-Pace/-Power
   - Herzfrequenz-Daten
```

**Tech Stack**:
- Garmin Connect API
- Strava API
- Webhook-Handling (Vercel Edge Functions)

**Datenmodell-Erweiterung**:
```prisma
model TrainingSession {
  // ... existing
  actualDuration  Int?
  actualPace      String?
  actualPower     Int?
  avgHeartRate    Int?
  garminActivityId String?
  stravaActivityId String?
}
```

---

### 3. **E-Mail-Benachrichtigungen**

**Feature**: Erinnerungen für anstehende Trainings

**Trigger**:
- Täglich 18:00 Uhr: Übersicht morgen + nächste 3 Tage
- 1 Stunde vor Einheit (wenn User Zeitpunkt angegeben hat)
- Wöchentlich: Zusammenfassung letzte Woche

**Tech Stack**:
- Resend (Email-API)
- Inngest (Background Jobs + Scheduling)
- React Email (Email-Templates)

**Email-Templates**:
```tsx
// emails/DailyReminder.tsx
export function DailyReminder({ sessions }: { sessions: Session[] }) {
  return (
    <Html>
      <Head />
      <Body>
        <h1>Your Training Plan for Tomorrow</h1>
        {sessions.map(s => (
          <SessionCard key={s.id} session={s} />
        ))}
      </Body>
    </Html>
  )
}
```

---

### 4. **Mobile App** (React Native)

**Feature**: Native iOS/Android App

**Features**:
- Dashboard (identisch zu Web)
- Plan-Ansicht
- Quick-Completion (Swipe to complete)
- Offline-Support (lokale DB-Sync)
- Push-Benachrichtigungen

**Tech Stack**:
- React Native + Expo
- Expo Router (File-based Routing)
- TanStack Query (Data Fetching)
- SQLite (Offline-Storage)
- Expo Notifications

**API-Sharing**:
- Gleiche REST API wie Web
- Shared TypeScript Types

---

### 5. **Erweiterte Analytics**

**Feature**: Detaillierte Fortschritts-Analysen

**Metriken**:
- Fitness Trend (CTL - Chronic Training Load)
- Fatigue (ATL - Acute Training Load)
- Form (TSB - Training Stress Balance)
- Predicted Race Time (basierend auf Metriken-Entwicklung)
- Injury Risk Score (hohe Belastung + niedrige Readiness)

**Visualisierungen**:
- PMC-Chart (Performance Management Chart)
- Fitness vs. Fatigue Graph
- Discipline Distribution Over Time
- Pace/Power Progression Charts

---

### 6. **Ernährungsplanung**

**Feature**: KI-generierte Ernährungspläne

**Inputs**:
- Körpergewicht, Körpergröße
- Ziel (Gewicht halten/verlieren/zunehmen)
- Trainingsvolumen (automatisch berechnet)

**Outputs**:
- Tägliche Makro-Empfehlungen (Carbs, Protein, Fat)
- Mahlzeit-Vorschläge
- Wettkampf-Verpflegungsplan (Pre-Race, During, Post)

**Tech**:
- Separate Claude API Calls
- Zod Schema für Mahlzeiten
- Rezept-Datenbank (optional)

---

### 7. **Coach-Mode** (Multi-User)

**Feature**: Coaches können Athleten-Accounts verwalten

**Rollen**:
- Athlete (Standard-User)
- Coach (kann mehrere Athletes sehen/bearbeiten)

**Coach-Features**:
- Dashboard mit allen Athleten
- Plan-Generierung für Athletes
- Manuelle Plan-Anpassungen
- Feedback-Loop (Coach → Athlete)

**Datenmodell**:
```prisma
model User {
  role     Role @default(ATHLETE)
  coachId  String?
  coach    User?   @relation("CoachAthlete", fields: [coachId], references: [id])
  athletes User[]  @relation("CoachAthlete")
}

enum Role {
  ATHLETE
  COACH
}
```

---

### 8. **Community-Features**

**Feature**: Soziale Komponente

**Features**:
- Pläne teilen (öffentlich/privat Link)
- Leaderboards (wöchentliches Volumen, Completion Rate)
- Gruppen (z.B. "Hamburg Ironman 2026 Prep")
- Activity Feed ("Max completed 5 sessions this week!")

**Tech**:
- Neue Datenmodelle (Post, Comment, Like, Follow)
- Real-time Updates (Pusher/Ably)
- Moderation (Reports, Bans)

---

## 📊 Feature-Prioritäten-Matrix

| Feature | Nutzer-Wert | Entwicklungs-Aufwand | Priorität |
|---------|-------------|----------------------|-----------|
| Kalender-Export | Sehr Hoch | Mittel | **1** |
| Garmin/Strava Sync | Sehr Hoch | Hoch | **2** |
| E-Mail-Benachrichtigungen | Hoch | Niedrig | **3** |
| Mobile App | Hoch | Sehr Hoch | **4** |
| Erweiterte Analytics | Mittel | Mittel | **5** |
| Ernährungsplanung | Mittel | Hoch | **6** |
| Coach-Mode | Niedrig | Sehr Hoch | **7** |
| Community | Niedrig | Sehr Hoch | **8** |

---

**Version**: 2.0 Dokumentation
**Erstellt**: 14. November 2025
**Zielgruppe**: Product Manager, Entwickler, Stakeholder
**Status**: MVP vollständig dokumentiert, Roadmap definiert

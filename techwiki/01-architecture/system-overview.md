# System Overview - Tri-Train-Buddy

## Vision Summary

> "Dein persönlicher KI-Trainingscoach, der mit dir lernt"

**Kernversprechen:** Professionelles Training, das in dein Leben passt - nicht umgekehrt.

**Target:** Hobbyathleten mit konkretem Ziel (Marathon, Ironman, etc.) die:
- Nicht wissen wie man richtig plant
- Training um ihr Leben herum bauen müssen
- Lernen WOLLEN, nicht nur Plan abarbeiten
- Keinen 300€/Monat-Coach bezahlen können/wollen

---

## High-Level Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  Next.js 15 App Router + React 19 + TypeScript     │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Conversational│  │  Dashboard   │  │ Progress │ │
│  │  Onboarding  │  │  + Insights  │  │ Analytics│ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────┐
│                  API LAYER (Next.js)                │
│                                                     │
│  REST Endpoints + Server Actions                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │ Auth API │  │ Plan API │  │ Feedback API    │  │
│  └──────────┘  └──────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│  DATABASE   │  │  AI ENGINES  │  │  EXTERNAL    │
│             │  │              │  │  SERVICES    │
│ PostgreSQL  │  │ Claude API   │  │              │
│ (Neon)      │  │ + Custom     │  │ - Garmin API │
│             │  │   Logic      │  │ - Strava API │
│ - Users     │  │              │  │ - Email      │
│ - Plans     │  │ 1. Plan Gen  │  │              │
│ - Workouts  │  │ 2. NLP Parse │  │              │
│ - Feedback  │  │ 3. Learning  │  │              │
│ - Analytics │  │ 4. Explain   │  │              │
└─────────────┘  └──────────────┘  └──────────────┘
```

---

## Core Philosophy: "Smart Defaults, Flexible Overrides"

### Principle 1: Start Simple, Add Complexity

**Bad Approach:**
```
Initial Setup: 50 fields, FTP tests, zone calculations, etc.
→ User overwhelmed, 50% abandon
```

**Our Approach:**
```
Initial Setup: 5 questions in natural language
→ AI infers rest from context
→ User can refine later
```

**Example:**
```
Question: "Wie weit kannst du aktuell locker laufen?"
User: "10-15km"

AI infers:
- Weekly volume: ~30-40km (3-4 runs)
- Pace estimate: 6:30-7:00/km (will test later)
- Experience level: Intermediate
- Can start with base-building phase
```

### Principle 2: Conversation over Forms

**Traditional UX:**
```
[Dropdown: Training Days]
  → Monday
  → Tuesday
  → Wednesday
  ...

[Dropdown: Preferred Time]
  → Morning
  → Afternoon
  → Evening
```

**Our UX:**
```
"Wann kannst du trainieren?"

[Textfeld - Natural Language]

User: "Morgens vor der Arbeit, Mittwoch und Freitag Abend,
       Wochenende flexibel"

AI parses:
- Morning sessions: Short (30-45min, before work)
- Wed/Fri evening: Medium (60-90min)
- Weekend: Long/hard sessions (time flexible)
```

### Principle 3: Explain Everything

**Every workout has 3 layers:**

1. **What** (The workout itself)
2. **Why** (Educational moment)
3. **How** (Execution guidance)

**Example:**
```
WHAT:
🏃 Easy Run | 60 Min | 6:30-7:00/km

WHY: (Click to expand)
Easy runs build your aerobic base. They train your body
to burn fat, strengthen your heart, and adapt tendons/ligaments.
80% of your training should be easy!

HOW:
- You should be able to speak full sentences
- If you can't talk → Slow down!
- It's OK to feel "too slow" - that's correct
```

---

## Key Technical Challenges & Solutions

### Challenge 1: Natural Language Understanding

**Problem:** User writes "Nächste Woche Dienstreise München, nur Hotel-Gym"

**Solution: Structured Prompting + Validation Loop**

```typescript
// Step 1: Parse with Claude
const parseConstraint = async (userInput: string) => {
  const result = await generateObject({
    model: anthropic('claude-sonnet-4'),
    schema: constraintSchema,
    prompt: `
      Parse this training constraint:
      "${userInput}"

      Extract:
      - Date range (if mentioned)
      - Type (travel, injury, event, etc.)
      - Available equipment/locations
      - Severity (blocks all training vs. modifies it)
    `
  })

  return result.object
}

// Step 2: Confirm with user
const confirmConstraint = (parsed) => {
  return `
    Verstanden:
    • ${parsed.dateRange}
    • ${parsed.type}
    • ${parsed.available}

    [Stimmt so] [Korrigieren]
  `
}
```

**Fallback:** If parsing confidence < 80%, ask clarifying question

---

### Challenge 2: Plan Quality & Safety

**Problem:** AI might generate unsafe plans (too much volume, bad progression)

**Solution: Multi-Layer Validation**

```typescript
const validatePlan = (plan: GeneratedPlan, athlete: Athlete) => {
  const validators = [
    validateVolumeProgression,    // Max +10% week-over-week
    validateIntensityDistribution, // 80/20 rule
    validateRecovery,             // Min 48h between hard sessions
    validateRunTolerance,         // Respect athlete's max km/week
    validatePhaseAppropriateness  // Base phase = no VO2max work
  ]

  for (const validator of validators) {
    const result = validator(plan, athlete)
    if (!result.valid) {
      throw new PlanValidationError(result.reason)
    }
  }

  return true
}
```

**Conservative Defaults:**
- Start with 80% of athlete's stated capacity
- Never increase volume AND intensity together
- Always include recovery weeks (every 3-4 weeks)
- Prefer under-training over over-training

---

### Challenge 3: Learning from Feedback

**Problem:** User says "Workout war zu hart" - what does that mean?

**Solution: Contextual Feedback Analysis**

```typescript
interface WorkoutFeedback {
  workoutId: string
  rating: 1 | 2 | 3 | 4 | 5  // Feeling scale
  completed: boolean
  notes?: string              // Free text
}

const analyzeFeedback = async (feedback: WorkoutFeedback) => {
  // Get context
  const workout = await getWorkout(feedback.workoutId)
  const recentWorkouts = await getRecentWorkouts(7) // Last 7 days
  const athlete = await getAthlete()

  // AI analysis
  const analysis = await generateObject({
    model: anthropic('claude-sonnet-4'),
    schema: feedbackAnalysisSchema,
    prompt: `
      Workout: ${workout.description}
      User feeling: ${feedback.rating}/5
      User notes: ${feedback.notes || 'None'}

      Recent workouts: ${recentWorkouts}
      Athlete metrics: ${athlete.metrics}

      Analyze:
      1. Was this workout appropriately difficult?
      2. Is there a pattern (always hard after long runs)?
      3. What should we adjust in next plan?
      4. What educational moment can we provide?
    `
  })

  // Store learnings
  await storeAthletePreference({
    athleteId: athlete.id,
    learning: analysis.adjustment,
    context: analysis.pattern
  })

  return analysis
}
```

---

### Challenge 4: Educational Layer (Explain Everything)

**Problem:** How to explain complex concepts to beginners?

**Solution: Progressive Disclosure + Context-Aware Explanations**

```typescript
// Explanation database (could be in trainwiki/)
const explanations = {
  'easy-run': {
    beginner: `
      Easy runs sind lockere Läufe. Du solltest dabei noch
      sprechen können. Sie fühlen sich "zu leicht" an -
      das ist richtig so! 80% deines Trainings sollte easy sein.
    `,
    intermediate: `
      Easy runs (Z1-2) trainieren dein aerobes System.
      Dabei baust du Mitochondrien auf, verbesserst Fettverbrennung,
      und stärkst Sehnen/Bänder mit minimalem Verletzungsrisiko.
    `,
    advanced: `
      Easy runs (<75% threshold) maximize aerobic adaptations
      while minimizing fatigue accumulation. Decoupling
      should be <5% on well-executed aerobic runs.
    `
  },
  // ... more concepts
}

const getExplanation = (concept: string, athleteLevel: string) => {
  return explanations[concept][athleteLevel]
}
```

**Dynamic Explanations:**
```typescript
// Before first interval session
const preWorkoutEducation = `
  Morgen: Dein erstes Intervall-Training! 🎯

  Was sind Intervalle?
  Kurze, schnelle Abschnitte mit Pausen dazwischen.

  Warum machen wir das?
  Trainiert deine VO2max (maximale Sauerstoffaufnahme).
  Macht dich schneller!

  Wie fühlt es sich an?
  Hart! 8-9/10 Anstrengung. Das ist normal.

  [Vorbereitung lesen] [Video ansehen]
`
```

---

## Data Flow: From User Input to Training Plan

### Complete Flow

```
1. USER ONBOARDING
   ↓
   User answers conversational questions
   ↓
2. INITIAL PROFILE CREATION
   ↓
   {
     goal: "Marathon Hamburg, April 2026",
     currentLevel: "10-15km comfortable",
     availability: "Mornings + Wed/Fri evenings + Weekend",
     constraints: "Knee issues in past"
   }
   ↓
3. AI INFERENCE
   ↓
   Claude analyzes + infers:
   - Estimated pace: 6:30-7:00/km
   - Weekly volume: 35km (conservative start)
   - Experience: Intermediate
   - Phase: Base-building (22 weeks out)
   - Risk profile: Injury-prone → conservative progression
   ↓
4. PLAN GENERATION
   ↓
   {
     trainingPhase: "Base",
     weeklyVolume: 35km,
     distribution: "80% easy, 20% moderate",
     progressionRate: 8% (conservative due to history),
     recoveryWeeks: "Every 3 weeks",
     sessions: [...]
   }
   ↓
5. VALIDATION
   ↓
   - Volume progression safe? ✅
   - Intensity distribution correct? ✅
   - Recovery adequate? ✅
   - Run tolerance respected? ✅
   ↓
6. PRESENTATION WITH EXPLANATIONS
   ↓
   Each workout includes:
   - What to do
   - Why you're doing it
   - How to execute it
   ↓
7. USER EXECUTION + FEEDBACK
   ↓
   User: "Workout war zu hart, Beine müde vom Sonntag"
   ↓
8. LEARNING & ADJUSTMENT
   ↓
   AI learns:
   - This athlete needs 48h+ recovery after long runs
   - Update preference: "Post-long-run recovery: 48-72h"
   ↓
9. NEXT PLAN INCORPORATES LEARNING
   ↓
   New plan has easy day or rest after long runs
```

---

## Smart Features: How They Work

### 1. Constraint Parsing

**Input:** "18.-20. Nov Geschäftsreise München, nur Hotel-Gym"

**Processing:**
```typescript
const parsed = {
  type: 'travel',
  dateRange: {
    start: '2024-11-18',
    end: '2024-11-20'
  },
  location: 'München',
  equipment: ['treadmill', 'basic-gym'],
  impact: 'modify' // Not 'block'
}

const adjustments = {
  '2024-11-18': {
    original: 'Outdoor 10km easy',
    adjusted: 'Treadmill 30min easy (hotel gym)'
  },
  '2024-11-19': {
    original: 'Intervals outdoor',
    adjusted: 'Treadmill intervals (6×3min hard, 2min recovery)'
  },
  '2024-11-20': {
    original: 'Rest',
    adjusted: 'Rest' // No change needed
  }
}
```

---

### 2. Compliance Tracking & Motivation

**Trigger:** User completes 7 days in a row

**System Response:**
```typescript
const checkStreak = async (athleteId: string) => {
  const last7Days = await getWorkoutsLast7Days(athleteId)

  if (last7Days.every(day => day.completed)) {
    await createAchievement({
      athleteId,
      type: 'streak',
      value: 7,
      message: `
        🔥 7-Tage-Streak!

        Du hast 7 Tage in Folge trainiert!
        Das zeigt echte Disziplin. Konsistenz ist wichtiger
        als einzelne perfekte Workouts.

        Weiter so! 💪
      `
    })

    // Show on next dashboard visit
  }
}
```

**Gamification Elements:**
```typescript
const achievements = {
  firstPlan: "🎯 Erster Plan erstellt",
  firstWorkout: "🏃 Erstes Training absolviert",
  streak7: "🔥 7-Tage-Streak",
  streak30: "🔥🔥 30-Tage-Streak",
  firstLongRun: "🏃‍♂️ Erste Lange Einheit (>90min)",
  weekPerfect: "💯 Perfekte Woche (100% Compliance)",
  monthConsistent: "📅 Konsistenter Monat (>80% Compliance)",
  goalAchieved: "🏆 Ziel erreicht!"
}
```

---

### 3. Progressive Education

**Concept:** Teach concepts when they become relevant

```typescript
const educationalMoments = {
  // Before first occurrence
  beforeFirstInterval: `
    Was sind Intervalle? Kurze schnelle Abschnitte...
  `,

  beforeFirstLongRun: `
    Long Runs sind länger als 90min. Sie trainieren...
  `,

  beforeFirstBrick: `
    Ein Brick-Workout kombiniert 2 Sportarten...
  `,

  // After patterns emerge
  afterMultipleHardRatings: `
    Ich sehe, mehrere Workouts waren "zu hart".
    Lass uns über Recovery sprechen...
  `,

  // Weekly tips
  weeklyTip: `
    📖 Tipp der Woche: 80/20-Regel

    80% deines Trainings sollte easy sein.
    Viele machen den Fehler, zu oft "mittel-hart"
    zu trainieren. Das bringt nicht viel und
    macht nur müde.

    Besser: Sehr easy ODER sehr hard!
  `
}
```

---

### 4. Context-Aware Dashboard

**Not just:** List of workouts

**But:** Intelligent prioritization + insights

```typescript
const getDashboardData = async (athleteId: string) => {
  const today = new Date()
  const athlete = await getAthlete(athleteId)
  const plan = await getActivePlan(athleteId)

  // Smart insights
  const insights = []

  // Check if next workout is new type
  const nextWorkout = plan.nextWorkout
  if (nextWorkout.isFirstOfType) {
    insights.push({
      type: 'education',
      title: `Erstes ${nextWorkout.type}-Training!`,
      content: explanations[nextWorkout.type][athlete.level],
      cta: 'Vorbereitung lesen'
    })
  }

  // Check compliance
  const weekCompliance = plan.thisWeekCompliance
  if (weekCompliance === 100 && plan.thisWeek.daysRemaining > 0) {
    insights.push({
      type: 'motivation',
      title: 'Perfekte Woche bisher! 🎉',
      content: 'Du hast alle Workouts diese Woche absolviert. Weiter so!',
      cta: null
    })
  }

  // Check if close to goal
  const weeksToGoal = plan.weeksToGoal
  if (weeksToGoal === 4) {
    insights.push({
      type: 'milestone',
      title: 'Nur noch 4 Wochen! 🎯',
      content: `
        Dein ${athlete.goal} ist in 4 Wochen!
        Jetzt beginnt die Taper-Phase. Wir reduzieren
        das Volumen, damit du frisch zum Wettkampf kommst.
      `,
      cta: 'Taper-Plan ansehen'
    })
  }

  return {
    nextWorkout,
    insights,
    weekProgress: weekCompliance,
    streak: athlete.currentStreak,
    // ... more
  }
}
```

---

## Technology Decisions

### Frontend: Next.js 15 + React 19

**Why?**
- ✅ Server Components = Better Performance
- ✅ App Router = Better DX
- ✅ Server Actions = Simplified API
- ✅ TypeScript = Type Safety
- ✅ Tailwind = Fast Styling

**Key Libraries:**
- React Hook Form (forms)
- Zod (validation)
- Recharts (progress charts)
- Framer Motion (animations for gamification)
- React Markdown (educational content)

---

### Backend: Next.js API Routes

**Why?**
- ✅ Same codebase as frontend
- ✅ Edge Functions support
- ✅ Vercel deployment optimized
- ✅ TypeScript end-to-end

**Structure:**
```
src/app/api/
├── auth/
├── onboarding/
├── plan/
│   ├── generate/
│   ├── [id]/
│   └── feedback/
├── workout/
│   ├── [id]/
│   └── complete/
└── analytics/
```

---

### Database: PostgreSQL (Neon)

**Why?**
- ✅ Relational (complex queries)
- ✅ JSONB (flexible athlete preferences)
- ✅ Neon = Serverless (cost-effective)
- ✅ Prisma ORM (type-safe queries)

**Schema Highlights:**
```prisma
model Athlete {
  id              String
  email           String
  goal            String
  currentLevel    Json    // Inferred from onboarding
  preferences     Json    // Learned from feedback
  weeklyVolume    Int
  injuryHistory   String[]
  // ... more
}

model TrainingPlan {
  id              String
  athleteId       String
  startDate       DateTime
  endDate         DateTime
  phase           String  // Base, Build, Peak, Taper
  weeklyVolume    Int
  generatedBy     String  // AI model version
  constraints     Json    // User constraints
  // ... more
}

model Workout {
  id              String
  planId          String
  date            DateTime
  type            String  // Easy, Tempo, Intervals, Long
  discipline      String  // Run, Bike, Swim, Strength
  durationMin     Int
  description     String
  explanation     String  // Educational layer
  completed       Boolean
  rating          Int?    // 1-5
  notes           String?
  // ... more
}

model AthletePreference {
  id              String
  athleteId       String
  learningType    String  // recovery-needs, hard-day-tolerance
  context         Json    // Pattern details
  appliedAt       DateTime
  // ... more
}
```

---

### AI: Claude Sonnet 4

**Why Claude over GPT-4?**
- ✅ Better instruction following
- ✅ Longer context (200K tokens)
- ✅ Structured outputs (generateObject)
- ✅ Better at reasoning
- ✅ Anthropic's safety features

**Cost Management:**
- Prompt Caching (for trainwiki knowledge)
- Conservative context (only relevant data)
- Batch non-urgent requests

**Estimated Costs:**
```
Plan Generation: ~$0.08-0.12 per plan
NLP Parsing: ~$0.01-0.02 per constraint
Feedback Analysis: ~$0.02-0.04 per workout
Explanations: Pre-generated (no cost)

Total/user/month: ~$0.50-1.00 (4 plans + feedback)
```

---

## Deployment Strategy

### Phase 1: MVP (Self-Hosted Only)

**Goal:** Validate with 5-10 beta users

**Stack:**
- Vercel (Free Tier)
- Neon (Free Tier)
- Anthropic API (Pay-as-you-go)

**Features:**
- Basic onboarding
- Plan generation
- Workout tracking
- Minimal explanations

---

### Phase 2: Hosted Service Launch

**Goal:** 50-100 paying users

**Stack:**
- Vercel Pro ($20/month)
- Neon Scale ($30/month)
- Anthropic API (~$50/month for 100 users)

**New Features:**
- Full educational layer
- Advanced analytics
- Email notifications
- Better UX polish

---

### Phase 3: Scale

**Goal:** 500+ users

**Infrastructure:**
- Vercel Enterprise
- Neon Production
- Redis for caching (Upstash)
- Background jobs (Inngest)
- Monitoring (Sentry)

---

## Key Metrics to Track

### Product Health
- Onboarding completion rate (target: >80%)
- First plan generation time (target: <5min)
- Workout completion rate (target: >70%)
- Feedback submission rate (target: >50%)

### Learning Engine
- NLP parsing accuracy (target: >90%)
- Plan validation pass rate (target: >95%)
- User satisfaction with explanations (survey)

### Business
- Free-to-Paid conversion (target: >15%)
- Monthly churn (target: <10%)
- Average session duration
- Weekly active users (WAU)

---

## Next Steps for Implementation

### Week 1-2: Foundation
1. Set up project structure
2. Database schema design
3. Authentication (BetterAuth)
4. Basic UI components

### Week 3-4: Core Features
1. Conversational onboarding
2. Plan generation (basic)
3. Workout display
4. Simple feedback

### Week 5-6: Smart Features
1. Educational layer
2. NLP constraint parsing
3. Feedback learning
4. Dashboard insights

### Week 7-8: Polish & Beta
1. UX refinements
2. Error handling
3. Beta testing with 5 users
4. Iterate based on feedback

---

**Status:** Architecture defined, ready for implementation
**Next Document:** Detailed Database Schema Design

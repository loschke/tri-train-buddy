# Database Schema Design

## Philosophy

**Key Principles:**
1. **Flexible Learning:** Store athlete preferences as JSON (learn over time)
2. **Audit Trail:** Track all AI decisions (plan generation, adjustments)
3. **Performance:** Index frequently queried fields
4. **Type Safety:** Prisma generates TypeScript types

---

## Core Models

### 1. User / Athlete

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  emailVerified Boolean  @default(false)
  name          String?
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  sessions      Session[]
  accounts      Account[]
  athleteProfile AthleteProfile?
  plans         TrainingPlan[]
  workouts      Workout[]
  feedback      WorkoutFeedback[]
  achievements  Achievement[]
  preferences   AthletePreference[]

  @@map("user")
}

model AthleteProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Goal & Level (from onboarding)
  goal            String   // "Marathon Hamburg April 2026"
  goalType        GoalType // MARATHON, HALF_MARATHON, IRONMAN, etc.
  goalDate        DateTime
  currentLevel    Json     // Inferred from onboarding answers
  /*
    currentLevel example:
    {
      "runDistance": "10-15km",
      "runFeeling": "comfortable",
      "estimatedPace": "6:30-7:00",
      "weeklyVolume": 35,
      "experience": "intermediate"
    }
  */

  // Availability
  availability    Json     // Parsed from natural language
  /*
    availability example:
    {
      "mornings": ["monday", "tuesday", "thursday", "friday"],
      "evenings": ["wednesday", "friday"],
      "weekend": "flexible",
      "preferredTime": "morning",
      "constraints": [
        {
          "day": "wednesday",
          "limitation": "max 60min",
          "reason": "family dinner"
        }
      ]
    }
  */

  // Injury History & Risk
  injuryHistory   String[] // Free text from user
  riskProfile     String   // CONSERVATIVE, MODERATE, AGGRESSIVE
  maxWeeklyIncrease Float  // e.g., 0.08 for 8% max

  // Current Metrics (evolves over time)
  runThresholdPace String? // e.g., "5:50"
  ftpWatts        Int?
  swimCss         String?  // Critical Swim Speed
  runToleranceKm  Int?     // Max km/week before injury risk

  // Learning & Preferences (AI-populated)
  learnedPreferences Json @default("{}")
  /*
    learnedPreferences example:
    {
      "postLongRunRecovery": "48-72h",
      "hardDayTolerance": "max 2 per week",
      "preferredLongRunDay": "saturday",
      "travelAdaptability": "high",
      "feedbackPatterns": {
        "intervalsAlwaysHard": true,
        "morningWorkoutsBetter": false
      }
    }
  */

  onboardingCompleted Boolean @default(false)
  onboardingStep      Int     @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
}

enum GoalType {
  MARATHON
  HALF_MARATHON
  TEN_K
  FIVE_K
  IRONMAN
  HALF_IRONMAN
  OLYMPIC_TRI
  SPRINT_TRI
  ULTRA
  CUSTOM
}
```

---

### 2. Training Plan

```prisma
model TrainingPlan {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Plan Metadata
  name            String   // "Base Building - Weeks 1-2"
  startDate       DateTime
  endDate         DateTime // Always 14 days from start
  status          PlanStatus @default(ACTIVE)
  phase           TrainingPhase

  // Generation Context
  generatedAt     DateTime @default(now())
  generatedBy     String   // AI model version: "claude-sonnet-4-20250514"
  generationPrompt String  @db.Text // Full prompt for debugging
  
  // Input Data (snapshot at generation time)
  athleteSnapshot Json     // Athlete's profile when plan was created
  constraints     Json     // User constraints for this cycle
  /*
    constraints example:
    {
      "userInput": "Nächste Woche Dienstreise München 18.-20. Nov",
      "parsed": {
        "dateRange": ["2024-11-18", "2024-11-20"],
        "type": "travel",
        "equipment": ["treadmill", "hotel-gym"],
        "impact": "modify"
      }
    }
  */

  feedback        String?  @db.Text // User feedback from previous cycle

  // Plan Characteristics
  weeklyVolume    Int      // Total minutes/week
  volumeProgression Float  // e.g., 1.08 for 8% increase
  intensityDistribution Json
  /*
    intensityDistribution example:
    {
      "zone1": 20,  // % of total time
      "zone2": 60,
      "zone3": 5,
      "zone4": 10,
      "zone5": 5
    }
  */

  // AI Rationale
  rationale       String   @db.Text // Why this plan was generated
  educationalNotes String? @db.Text // Key learning points for this cycle

  // Relations
  workouts        Workout[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId, status])
  @@index([startDate])
}

enum PlanStatus {
  PLANNED   // Future plan
  ACTIVE    // Currently running
  COMPLETED // Past plan
  ARCHIVED  // User archived
}

enum TrainingPhase {
  BASE      // 16+ weeks out
  BUILD     // 8-16 weeks
  PEAK      // 4-8 weeks
  TAPER     // 0-4 weeks
  RECOVERY  // Post-race
}
```

---

### 3. Workout

```prisma
model Workout {
  id              String   @id @default(cuid())
  planId          String
  plan            TrainingPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Workout Details
  date            DateTime
  dayOfWeek       String   // "Monday", "Tuesday", etc.
  discipline      Discipline
  type            WorkoutType
  durationMin     Int
  intensityZone   String?  // "Z1", "Z2", "Z3-Z4", "Threshold"

  // Instructions
  title           String   // "Easy Run"
  description     String   @db.Text // Detailed workout description
  structure       Json?    // Structured workout (warmup, intervals, cooldown)
  /*
    structure example:
    {
      "warmup": {
        "duration": 10,
        "intensity": "Z1",
        "description": "Very easy warmup"
      },
      "main": [
        {
          "type": "interval",
          "reps": 6,
          "duration": 3,
          "intensity": "Z5",
          "recovery": 2,
          "description": "3min hard, 2min easy jog"
        }
      ],
      "cooldown": {
        "duration": 10,
        "intensity": "Z1"
      }
    }
  */

  // Educational Layer
  explanation     String   @db.Text // "Why am I doing this?"
  executionTips   String?  @db.Text // "How to execute well"
  isFirstOfType   Boolean  @default(false) // First time doing this type

  // Completion & Feedback
  completed       Boolean  @default(false)
  completedAt     DateTime?
  skipped         Boolean  @default(false)
  skippedReason   String?

  // Relations
  feedback        WorkoutFeedback?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId, date])
  @@index([planId, date])
}

enum Discipline {
  RUN
  BIKE
  SWIM
  STRENGTH
  BRICK      // Multi-sport
  REST
  ACTIVE_RECOVERY
}

enum WorkoutType {
  EASY
  LONG
  TEMPO
  THRESHOLD
  INTERVALS
  VO2MAX
  RECOVERY
  STRENGTH
  BRICK
  REST
}
```

---

### 4. Workout Feedback

```prisma
model WorkoutFeedback {
  id              String   @id @default(cuid())
  workoutId       String   @unique
  workout         Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Rating (1-5 scale)
  feeling         Int      // 😫=1, 😅=2, 😊=3, 😎=4, 🔥=5
  perceivedDifficulty Int  // 1-10 scale

  // Free Text Feedback
  notes           String?  @db.Text // User's own notes
  
  // Specific Questions (if asked)
  tooHard         Boolean?
  tooEasy         Boolean?
  motivationLevel Int?     // 1-5

  // AI Analysis
  aiAnalysis      Json?
  /*
    aiAnalysis example:
    {
      "pattern": "hard_after_long_run",
      "recommendation": "increase recovery time post-long-run",
      "learningApplied": true,
      "educationalMoment": "Recovery is when your body gets stronger..."
    }
  */

  analyzed        Boolean  @default(false)
  analyzedAt      DateTime?

  createdAt       DateTime @default(now())

  @@index([userId, createdAt])
}
```

---

### 5. Athlete Preference (AI Learning)

```prisma
model AthletePreference {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Learning Type
  category        PreferenceCategory
  key             String   // e.g., "post-long-run-recovery"
  value           Json     // Flexible structure
  /*
    value examples:
    
    For "post-long-run-recovery":
    {
      "minHours": 48,
      "maxHours": 72,
      "confidence": 0.85,
      "dataPoints": 5
    }

    For "hard-day-tolerance":
    {
      "maxPerWeek": 2,
      "minDaysBetween": 2,
      "confidence": 0.9,
      "dataPoints": 8
    }
  */

  // Context
  learnedFrom     String   // "feedback-analysis", "explicit-user-input"
  confidence      Float    // 0.0-1.0
  dataPoints      Int      // How many observations led to this

  // Application
  applied         Boolean  @default(false)
  appliedInPlan   String?  // Plan ID where first applied
  
  // Lifecycle
  active          Boolean  @default(true)
  supersededBy    String?  // If replaced by newer learning

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId, category, active])
  @@unique([userId, key])
}

enum PreferenceCategory {
  RECOVERY       // Recovery needs
  INTENSITY      // Intensity tolerance
  SCHEDULING     // Time preferences
  MOTIVATION     // What motivates this athlete
  EQUIPMENT      // Equipment access/preferences
  NUTRITION      // Fueling patterns
  INJURY_RISK    // Injury patterns
}
```

---

### 6. Achievement (Gamification)

```prisma
model Achievement {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Achievement Type
  type            AchievementType
  tier            Int      // 1=Bronze, 2=Silver, 3=Gold
  
  // Display
  title           String   // "7-Day Streak"
  description     String   // "Trained 7 days in a row"
  icon            String   // "🔥"
  
  // Trigger
  triggeredBy     String?  // Workout ID or Plan ID
  value           Int?     // e.g., 7 for 7-day-streak

  // Status
  unlockedAt      DateTime @default(now())
  viewed          Boolean  @default(false)

  @@index([userId, unlockedAt])
}

enum AchievementType {
  FIRST_PLAN
  FIRST_WORKOUT
  STREAK_7
  STREAK_30
  WEEK_PERFECT
  MONTH_CONSISTENT
  FIRST_LONG_RUN
  FIRST_INTERVALS
  GOAL_ACHIEVED
  TOTAL_DISTANCE  // e.g., 100km total
  TOTAL_TIME      // e.g., 50 hours total
}
```

---

## JSON Schema Examples

### AthleteProfile.currentLevel

```typescript
interface CurrentLevel {
  // From onboarding questions
  runDistance: string       // "10-15km"
  runFeeling: string        // "comfortable", "challenging"
  estimatedPace: string     // "6:30-7:00"
  weeklyVolume: number      // 35 (km for run, hours for tri)
  experience: 'beginner' | 'intermediate' | 'advanced'
  
  // Sport-specific (if applicable)
  bikeLevel?: {
    distance: string
    ftp?: number
  }
  swimLevel?: {
    distance: string
    css?: string
  }
}
```

### TrainingPlan.constraints

```typescript
interface Constraints {
  userInput: string         // Raw text from user
  parsed: {
    dateRanges: Array<{
      start: string
      end: string
      type: 'travel' | 'event' | 'injury' | 'other'
      equipment?: string[]
      location?: string
      impact: 'block' | 'modify' | 'note'
    }>
  }
  parsingConfidence: number // 0.0-1.0
}
```

### Workout.structure

```typescript
interface WorkoutStructure {
  warmup?: {
    duration: number        // minutes
    intensity: string       // "Z1", "Z2"
    description: string
  }
  main: Array<{
    type: 'continuous' | 'interval' | 'pyramid'
    duration?: number       // For continuous
    reps?: number          // For intervals
    interval?: {
      work: number
      rest: number
      intensity: string
    }
    description: string
  }>
  cooldown?: {
    duration: number
    intensity: string
    description: string
  }
}
```

---

## Indexes for Performance

```prisma
// Frequently accessed queries

@@index([userId, status])  // Get active plan for user
@@index([userId, date])    // Get today's workouts
@@index([planId, date])    // Get all workouts in plan
@@index([userId, createdAt]) // Feedback history
@@index([userId, category, active]) // Active preferences
```

---

## Migration Strategy

### Phase 1: MVP

```prisma
// Minimal schema
- User
- AthleteProfile (basic)
- TrainingPlan (basic)
- Workout
- WorkoutFeedback (simple)
```

### Phase 2: Learning

```prisma
// Add learning capabilities
+ AthletePreference
+ Extended JSON fields in AthleteProfile
```

### Phase 3: Gamification

```prisma
// Add motivation layer
+ Achievement
+ Extended analytics
```

---

## Example Queries

### Get Dashboard Data

```typescript
const dashboard = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    athleteProfile: true,
    plans: {
      where: { status: 'ACTIVE' },
      include: {
        workouts: {
          where: {
            date: {
              gte: startOfWeek,
              lte: endOfWeek
            }
          },
          orderBy: { date: 'asc' }
        }
      }
    },
    achievements: {
      where: { viewed: false },
      orderBy: { unlockedAt: 'desc' }
    }
  }
})
```

### Get Learning Insights

```typescript
const preferences = await prisma.athletePreference.findMany({
  where: {
    userId,
    active: true,
    confidence: { gte: 0.7 }
  },
  orderBy: { confidence: 'desc' }
})
```

### Feedback Analysis Query

```typescript
const recentFeedback = await prisma.workoutFeedback.findMany({
  where: {
    userId,
    analyzed: false
  },
  include: {
    workout: {
      include: {
        plan: true
      }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
})
```

---

**Next:** API Design & Endpoints

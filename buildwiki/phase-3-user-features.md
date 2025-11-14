# Phase 3: User Features

## Ziel
Komplette User Journey mit Conversational Onboarding, Educational Layer, und Dashboard Insights.

**Duration:** 1-2 Wochen
**Effort:** ~60-80 Stunden
**Risk Level:** 🟡 Medium (UX Complexity)

---

## Voraussetzungen

- ✅ Phase 1 & 2 erfolgreich abgeschlossen
- ✅ AI Engines funktionieren stabil
- ✅ User kann sich registrieren und anmelden

---

## Phase Milestones

### Milestone 3.1: Conversational Onboarding (Tag 1-4)
**Ziel:** Chat-basiertes Onboarding ersetzt Forms

### Milestone 3.2: Educational Content Engine (Tag 5-7)
**Ziel:** Workouts haben "Why" Explanations

### Milestone 3.3: Dashboard with AI Insights (Tag 8-9)
**Ziel:** Dashboard zeigt personalisierte Insights

### Milestone 3.4: Workout Tracking (Tag 10-11)
**Ziel:** Complete Workout Flow funktioniert

### Milestone 3.5: Feedback Analysis Engine (Tag 12-14)
**Ziel:** AI lernt aus Feedback

---

## Milestone 3.1: Conversational Onboarding

**Reference:** `techwiki/04-features/conversational-onboarding.md`

### Tasks

#### 3.1.1 Create Onboarding State Machine
**Estimated Time:** 2 hours

Erstelle `app/lib/ai/onboarding-handler.ts`:

```typescript
import { anthropic, selectModel } from './client'
import { z } from 'zod'

type OnboardingStep = 'welcome' | 'goal' | 'current_level' | 'availability' | 'injury_history' | 'confirmation' | 'complete'

interface ConversationState {
  userId: string
  currentStep: OnboardingStep
  extractedData: {
    goal?: string
    goalType?: string
    goalDate?: string
    currentLevel?: object
    availability?: object
    injuryHistory?: string[]
    riskProfile?: string
  }
  conversationHistory: Array<{
    role: 'assistant' | 'user'
    content: string
    timestamp: Date
  }>
}

const ResponseSchema = z.object({
  extractedData: z.object({
    goal: z.string().optional(),
    goalType: z.enum(['MARATHON', 'HALF_MARATHON', 'IRONMAN', 'HALF_IRONMAN', 'OLYMPIC_TRI', 'SPRINT_TRI', 'CUSTOM']).optional(),
    goalDate: z.string().optional(),
    currentLevel: z.object({
      experience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      weeklyVolume: z.number().optional(),
    }).optional(),
    availability: z.object({
      mornings: z.array(z.string()).optional(),
      evenings: z.array(z.string()).optional(),
      preferredTime: z.string().optional(),
    }).optional(),
    injuryHistory: z.array(z.string()).optional(),
    riskProfile: z.enum(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']).optional(),
  }),
  confidence: z.number(),
  nextStep: z.enum(['goal', 'current_level', 'availability', 'injury_history', 'confirmation', 'complete']),
  needsClarification: z.boolean(),
  clarifyingQuestion: z.string().optional(),
})

export async function processOnboardingMessage(
  state: ConversationState,
  userMessage: string
): Promise<{
  updatedState: ConversationState
  assistantResponse: string
  nextStep: OnboardingStep
}> {
  // Build prompt
  const systemPrompt = buildOnboardingPrompt(state)

  // Call AI
  const response = await anthropic.messages.create({
    model: selectModel('complex'),
    max_tokens: 1024,
    temperature: 0.5,
    system: systemPrompt,
    messages: [
      ...state.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No response from AI')
  }

  const parsed = JSON.parse(textContent.text)
  const result = ResponseSchema.parse(parsed)

  // Update state
  const updatedState: ConversationState = {
    ...state,
    currentStep: result.nextStep,
    extractedData: {
      ...state.extractedData,
      ...result.extractedData,
    },
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
    ],
  }

  // Generate next question
  let assistantResponse: string

  if (result.needsClarification && result.clarifyingQuestion) {
    assistantResponse = result.clarifyingQuestion
  } else if (result.nextStep === 'complete') {
    assistantResponse = generateConfirmationMessage(updatedState.extractedData)
  } else {
    assistantResponse = getNextQuestion(result.nextStep)
  }

  updatedState.conversationHistory.push({
    role: 'assistant',
    content: assistantResponse,
    timestamp: new Date(),
  })

  return {
    updatedState,
    assistantResponse,
    nextStep: result.nextStep,
  }
}

function buildOnboardingPrompt(state: ConversationState): string {
  return `You are a friendly endurance sports coach conducting an onboarding conversation.

Current step: ${state.currentStep}
Extracted data so far: ${JSON.stringify(state.extractedData)}

Your task:
1. Extract structured information from user's message
2. Infer experience level from how they describe their training
3. Determine if you need clarification or can move to next step
4. Be conversational and encouraging

Return JSON matching the schema.`
}

function getNextQuestion(step: OnboardingStep): string {
  const questions = {
    goal: 'Lass uns mit dem Wichtigsten starten: **Was ist dein Ziel?**',
    current_level: 'Super Ziel! Um deinen aktuellen Level einzuschätzen: **Wie viel trainierst du aktuell?**',
    availability: 'Jetzt zu deinem Alltag: **Wann hast du Zeit zum Trainieren?**',
    injury_history: 'Fast geschafft! **Hattest du in den letzten 2 Jahren Verletzungen?**',
    confirmation: 'Perfekt! Lass mich das zusammenfassen...',
    complete: '',
  }
  return questions[step] || ''
}

function generateConfirmationMessage(data: any): string {
  return `Perfekt! Ich habe jetzt alle Informationen. 🎉

**Zusammenfassung:**
- **Ziel**: ${data.goal}
- **Level**: ${data.currentLevel?.experience}
- **Verfügbarkeit**: ${JSON.stringify(data.availability)}

Soll ich jetzt deinen ersten 2-Wochen-Trainingsplan erstellen?`
}
```

**Time Estimate:** 2 hours
**Verification:**
- [ ] State Machine funktioniert
- [ ] Kann Conversation durchführen

---

#### 3.1.2 Create Chat UI
**Estimated Time:** 3 hours

Erstelle `app/onboarding/chat/page.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function OnboardingChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Initial message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hey! 👋 Ich bin dein persönlicher Trainingsassistent.\n\nLass uns mit dem Wichtigsten starten: **Was ist dein Ziel?**',
        timestamp: new Date(),
      },
    ])
  }, [])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/onboarding/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setProgress(data.progress || 0)

      if (data.isComplete) {
        setTimeout(() => {
          router.push('/onboarding/generating')
        }, 1500)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white border-b p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Setup Progress</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`max-w-[80%] p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </Card>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <Card className="p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Schreibe deine Antwort..."
            className="flex-1"
            rows={2}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            Senden
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Time Estimate:** 3 hours
**Verification:**
- [ ] Chat UI rendert korrekt
- [ ] Messages werden angezeigt
- [ ] Input funktioniert

---

#### 3.1.3 Test Complete Onboarding Flow
**Estimated Time:** 1 hour

**Test Scenarios:**
1. Complete onboarding with minimal input
2. Onboarding with ambiguous answers (needs clarification)
3. Skip button (future feature)

**Verification:**
- [ ] Can complete in < 5 minutes
- [ ] AthleteProfile created correctly
- [ ] Redirects to plan generation

---

## Milestone 3.2: Educational Content Engine

**Reference:** `techwiki/03-ai-engines/educational-content-engine.md`

### Tasks

#### 3.2.1 Implement Educational Content Generator
**Estimated Time:** 2.5 hours

Erstelle `app/lib/ai/educational-content.ts`:

```typescript
import { anthropic, selectModel } from './client'
import { loadTrainwikiDocs } from './trainwiki-loader'
import { z } from 'zod'

const EducationalContentSchema = z.object({
  explanation: z.string(),
  executionTips: z.string(),
  conceptsIntroduced: z.array(z.string()),
  relatedWikiPages: z.array(z.string()),
  progression: z.object({
    current: z.string(),
    next: z.string(),
    rationale: z.string(),
  }),
})

export async function generateEducationalContent(
  workout: any,
  athleteContext: {
    experience: 'beginner' | 'intermediate' | 'advanced'
    goal: string
    currentPhase: string
    isFirstOfType: boolean
    knownConcepts: string[]
  }
): Promise<z.infer<typeof EducationalContentSchema>> {
  // Load relevant trainwiki
  const wikiContext = await loadRelevantWikiForWorkout(workout)

  const systemPrompt = `You are an expert coach creating educational content for workouts.

**Athlete Context:**
- Experience: ${athleteContext.experience}
- Goal: ${athleteContext.goal}
- Phase: ${athleteContext.currentPhase}
- Known Concepts: ${athleteContext.knownConcepts.join(', ')}
- First time: ${athleteContext.isFirstOfType}

**Workout:**
- Type: ${workout.type}
- Discipline: ${workout.discipline}
- Duration: ${workout.durationMin} min
- Intensity: ${workout.intensityZone}

**Training Science:**
${wikiContext}

Generate educational content that explains WHY and HOW.

Return JSON matching the schema.`

  const response = await anthropic.messages.create({
    model: selectModel('complex'),
    max_tokens: 1536,
    temperature: 0.6,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: 'Generate educational content for this workout.',
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No response from AI')
  }

  const parsed = JSON.parse(textContent.text)
  return EducationalContentSchema.parse(parsed)
}

async function loadRelevantWikiForWorkout(workout: any): Promise<string> {
  const docs: string[] = ['core/80-20-rule.md']

  if (workout.type === 'EASY' || workout.type === 'LONG') {
    docs.push('core/recovery.md')
  }
  if (workout.type === 'THRESHOLD' || workout.type === 'INTERVALS') {
    docs.push('core/load-management.md')
  }

  if (workout.discipline === 'RUN') docs.push('sports/running.md')
  if (workout.discipline === 'BIKE') docs.push('sports/cycling.md')
  if (workout.discipline === 'SWIM') docs.push('sports/swimming.md')

  return loadTrainwikiDocs(docs)
}
```

**Time Estimate:** 2.5 hours
**Verification:**
- [ ] Generates educational content
- [ ] Explanation makes sense
- [ ] Execution tips helpful

---

## Milestone 3.3: Dashboard with AI Insights

**Reference:** `techwiki/04-features/dashboard-with-insights.md`

### Tasks

#### 3.3.1 Update Dashboard with Real Data
**Estimated Time:** 3 hours

Update `app/dashboard/page.tsx`:

```typescript
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { generateDailyInsight } from '@/lib/ai/daily-insights'
import { TodaysWorkout } from './components/todays-workout'
import { AIInsightCard } from './components/ai-insight'
import { WeeklyOverview } from './components/weekly-overview'

export default async function DashboardPage() {
  const user = await requireAuth()

  const [profile, todaysWorkout, weekWorkouts, totalWorkouts, insight] =
    await Promise.all([
      prisma.athleteProfile.findUnique({ where: { userId: user.id } }),
      getTodaysWorkout(user.id),
      getWeekWorkouts(user.id),
      prisma.workout.count({ where: { userId: user.id, completed: true } }),
      generateDailyInsight(user.id),
    ])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        Willkommen zurück, {user.name}!
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodaysWorkout
            workout={todaysWorkout}
            hasCompletedToday={todaysWorkout?.completed || false}
          />
        </div>
        <div>
          <AIInsightCard insight={insight} />
        </div>
      </div>

      <WeeklyOverview
        workouts={weekWorkouts}
        startDate={getMonday(new Date())}
      />
    </div>
  )
}

async function getTodaysWorkout(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return prisma.workout.findFirst({
    where: {
      userId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  })
}

async function getWeekWorkouts(userId: string) {
  const monday = getMonday(new Date())
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 7)

  return prisma.workout.findMany({
    where: {
      userId,
      date: { gte: monday, lt: sunday },
    },
    orderBy: { date: 'asc' },
  })
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
```

**Time Estimate:** 3 hours (including component creation)

---

## Milestone 3.4 & 3.5: Combined Testing

### Final Integration Tests
**Estimated Time:** 4 hours

**Complete User Journey Test:**
1. New user registers
2. Completes onboarding (conversational)
3. Plan is generated
4. Sees dashboard with today's workout
5. Completes workout
6. Gives feedback
7. Sees updated dashboard with insights

**Verification Checklist:**
- [ ] Complete journey works end-to-end
- [ ] No broken links
- [ ] All data persists correctly
- [ ] AI insights are relevant
- [ ] Educational content shows up
- [ ] Performance < 2s per page

---

## Success Criteria

Phase 3 ist **erfolgreich abgeschlossen**, wenn:

- ✅ Conversational onboarding funktioniert (< 5 min)
- ✅ Educational content auf allen Workouts
- ✅ Dashboard zeigt AI insights
- ✅ Complete user journey funktioniert
- ✅ Feedback analysis läuft
- ✅ Keine kritischen UX issues
- ✅ Performance targets erreicht

---

## Next Steps

⬜ **Start Phase 4:** Gamification → [phase-4-gamification.md](./phase-4-gamification.md)

---

**Estimated Total Time:** 60-80 hours
**Critical Path:** Onboarding → Educational Content → Dashboard
**Biggest Risk:** UX Complexity
**Mitigation:** User testing after each milestone

# Conversational Interface Engine

## Overview

The Conversational Interface Engine transforms natural language user input into structured data and manages intelligent dialogues throughout the app. This is a core differentiator from traditional form-based training apps.

**Key Capabilities:**
1. **Natural Language Parsing** - Convert free text to structured constraints
2. **Onboarding Conversations** - Extract athlete profile through dialogue
3. **Context Understanding** - Maintain conversation state and context
4. **Clarification Logic** - Ask intelligent follow-up questions
5. **Validation & Confirmation** - Ensure correct understanding before saving

---

## Architecture

```
User Input (Natural Language)
        ↓
   NLP Parsing Layer
   (Claude API + Structured Output)
        ↓
   Intent Classification
        ↓
   ┌─────────────┬─────────────┬──────────────┐
   │             │             │              │
Constraint   Onboarding   Feedback      Settings
Parsing      Flow         Analysis      Update
   │             │             │              │
   └─────────────┴─────────────┴──────────────┘
        ↓
   Validation & Confidence Check
        ↓
   ┌───────────┐
   │ Confident?│
   └─────┬─────┘
         │
    ┌────┴────┐
   Yes       No
    │         │
  Save    Ask Clarifying
           Question
```

---

## 1. Natural Language Constraint Parsing

### Use Case

User types: "Nächste Woche Dienstreise München 18.-20. Nov, habe nur Zugang zu Hotelgym und Laufband"

### Implementation

```typescript
// File: app/lib/ai/constraint-parser.ts

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Zod Schema for Constraint
const ConstraintSchema = z.object({
  userInput: z.string(),
  parsed: z.object({
    dateRanges: z.array(z.object({
      start: z.string(), // ISO date
      end: z.string(),
      type: z.enum(['travel', 'event', 'injury', 'vacation', 'work', 'other']),
      equipment: z.array(z.string()).optional(),
      location: z.string().optional(),
      impact: z.enum(['block', 'modify', 'note']),
      description: z.string(),
    })),
  }),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  clarifyingQuestions: z.array(z.string()).optional(),
})

type Constraint = z.infer<typeof ConstraintSchema>

export async function parseConstraint(
  userInput: string,
  athleteContext?: {
    timezone?: string
    upcomingWorkouts?: Array<{ date: string; type: string }>
  }
): Promise<Constraint> {

  const systemPrompt = `You are an expert at parsing natural language constraints for training schedules.

Extract structured information from user input about constraints, travel, events, or limitations.

IMPORTANT:
- Infer dates from context (e.g., "nächste Woche" = next week from today)
- Today's date: ${new Date().toISOString().split('T')[0]}
- User timezone: ${athleteContext?.timezone || 'Europe/Berlin'}
- Classify impact: 'block' if no training possible, 'modify' if limited, 'note' if just FYI
- Set confidence based on clarity of input
- Request clarification if dates/equipment ambiguous

Examples:

Input: "Nächste Woche Dienstreise München 18.-20. Nov"
Output: {
  dateRanges: [{
    start: "2024-11-18",
    end: "2024-11-20",
    type: "travel",
    location: "München",
    impact: "modify",
    description: "Business trip to Munich"
  }],
  confidence: 0.9,
  needsClarification: true,
  clarifyingQuestions: ["Hast du Zugang zu einem Fitnessstudio oder Laufmöglichkeiten in München?"]
}

Input: "Knie tut weh, lieber diese Woche kein Laufen"
Output: {
  dateRanges: [{
    start: "2024-11-11", // start of this week
    end: "2024-11-17",   // end of this week
    type: "injury",
    impact: "block",
    description: "Knee pain - no running this week"
  }],
  confidence: 0.85,
  needsClarification: true,
  clarifyingQuestions: ["Ist Radfahren oder Schwimmen noch möglich, oder brauchst du komplette Ruhe?"]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userInput,
      },
    ],
  })

  // Extract JSON from response
  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI')
  }

  const parsed = JSON.parse(textContent.text)

  // Validate with Zod
  return ConstraintSchema.parse(parsed)
}
```

### Usage in API Route

```typescript
// File: app/api/constraints/parse/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { parseConstraint } from '@/lib/ai/constraint-parser'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userInput } = await req.json()

  // Get athlete context
  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: session.user.id },
  })

  const constraint = await parseConstraint(userInput, {
    timezone: 'Europe/Berlin', // Could be from profile
  })

  // If needs clarification, return questions to user
  if (constraint.needsClarification) {
    return NextResponse.json({
      status: 'needs_clarification',
      constraint,
      questions: constraint.clarifyingQuestions,
    })
  }

  // Confidence check
  if (constraint.confidence < 0.7) {
    return NextResponse.json({
      status: 'low_confidence',
      constraint,
      message: 'Ich bin mir nicht ganz sicher. Kannst du das nochmal genauer beschreiben?',
    })
  }

  // High confidence - save directly
  // (Would integrate with plan generation)
  return NextResponse.json({
    status: 'success',
    constraint,
  })
}
```

---

## 2. Onboarding Conversation Flow

### Design Philosophy

Instead of multi-step forms, use a conversational flow that:
1. Asks open-ended questions
2. Infers level from answers
3. Follows up based on responses
4. Feels like talking to a coach

### Conversation State Machine

```typescript
// File: app/lib/ai/onboarding-flow.ts

type OnboardingStep =
  | 'welcome'
  | 'goal'
  | 'current_level'
  | 'availability'
  | 'injury_history'
  | 'confirmation'
  | 'complete'

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

const ONBOARDING_QUESTIONS = {
  welcome: `Hey! 👋 Ich bin dein persönlicher Trainingsassistent.

Ich helfe dir dabei, einen maßgeschneiderten Trainingsplan zu erstellen, der zu deinem Leben passt.

Lass uns mit dem Wichtigsten starten: **Was ist dein Ziel?**

(z.B. "Ich möchte im April 2026 den Hamburg Marathon laufen" oder "Ich will meinen ersten Halbironman schaffen")`,

  current_level: (goalType: string) => {
    const questions = {
      MARATHON: `Super Ziel! 🎯

Um deinen aktuellen Level einzuschätzen: **Wie weit läufst du aktuell regelmäßig?**

Erzähl mir einfach in eigenen Worten - wie oft läufst du, wie lang sind die Läufe, und wie fühlt es sich an?`,

      IRONMAN: `Wow, Ironman - das ist ambitioniert! 💪

Erzähl mir über deinen aktuellen Stand in den drei Disziplinen:
- **Schwimmen**: Wie weit schwimmst du am Stück?
- **Radfahren**: Wie lang sind deine typischen Ausfahrten?
- **Laufen**: Wie ist dein Lauftraining aktuell?`,
    }
    return questions[goalType as keyof typeof questions] || questions.MARATHON
  },

  availability: `Perfekt, das gibt mir ein gutes Bild! 📊

Jetzt zu deinem Alltag: **Wann hast du Zeit zum Trainieren?**

Beschreib einfach deine Woche - Morgens? Abends? Wochenende? Gibt es Tage, die schwierig sind?`,

  injury_history: `Fast geschafft! Eine wichtige Frage noch:

**Hattest du in den letzten 2 Jahren Verletzungen oder gibt es körperliche Beschwerden, die ich beachten sollte?**

(Das hilft mir, den Plan sicher zu gestalten)`,
}
```

### Conversation Handler

```typescript
// File: app/lib/ai/onboarding-handler.ts

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Response Schema
const OnboardingResponseSchema = z.object({
  extractedData: z.object({
    goal: z.string().optional(),
    goalType: z.enum(['MARATHON', 'HALF_MARATHON', 'IRONMAN', 'HALF_IRONMAN', 'OLYMPIC_TRI', 'SPRINT_TRI', 'CUSTOM']).optional(),
    goalDate: z.string().optional(), // ISO date
    currentLevel: z.object({
      runDistance: z.string().optional(),
      runFeeling: z.string().optional(),
      weeklyVolume: z.number().optional(),
      experience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      bikeLevel: z.object({
        distance: z.string().optional(),
      }).optional(),
      swimLevel: z.object({
        distance: z.string().optional(),
      }).optional(),
    }).optional(),
    availability: z.object({
      mornings: z.array(z.string()).optional(),
      evenings: z.array(z.string()).optional(),
      preferredTime: z.string().optional(),
      constraints: z.array(z.object({
        day: z.string(),
        limitation: z.string(),
      })).optional(),
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

  // Build context from conversation history
  const conversationContext = state.conversationHistory
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join('\n')

  const systemPrompt = `You are an expert endurance sports coach conducting an onboarding conversation.

Current step: ${state.currentStep}
Current extracted data: ${JSON.stringify(state.extractedData, null, 2)}

Your task:
1. Extract structured information from the user's response
2. Infer their experience level from how they describe their training
3. Determine if you need clarification or can move to next step
4. Be conversational, friendly, and encouraging

Guidelines:
- Infer goal dates from context (e.g., "im April" + current year context)
- Classify experience: beginner (<1 year), intermediate (1-3 years), advanced (3+ years)
- For availability, extract specific days and times
- For risk profile: CONSERVATIVE if injury history, MODERATE as default, AGGRESSIVE only if explicitly stated
- Always respond in German

Example extraction:

User: "Ich laufe aktuell 2-3 mal die Woche so 8-10km, fühlt sich gut an"
Extract: {
  currentLevel: {
    runDistance: "8-10km",
    runFeeling: "comfortable",
    weeklyVolume: 25, // estimate
    experience: "intermediate"
  },
  confidence: 0.85,
  nextStep: "availability"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    temperature: 0.5,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Conversation so far:\n${conversationContext}\n\nUser's latest message: ${userMessage}\n\nExtract data and determine next step.`,
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No response from AI')
  }

  const parsed = JSON.parse(textContent.text)
  const result = OnboardingResponseSchema.parse(parsed)

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

  // Generate next question or confirmation
  let assistantResponse: string

  if (result.needsClarification && result.clarifyingQuestion) {
    assistantResponse = result.clarifyingQuestion
  } else if (result.nextStep === 'complete') {
    assistantResponse = `Perfekt! Ich habe jetzt alle Informationen. 🎉

**Zusammenfassung:**
- **Ziel**: ${updatedState.extractedData.goal}
- **Aktuelles Level**: ${JSON.stringify(updatedState.extractedData.currentLevel)}
- **Verfügbarkeit**: ${JSON.stringify(updatedState.extractedData.availability)}

Soll ich jetzt deinen ersten 2-Wochen-Trainingsplan erstellen?`
  } else {
    assistantResponse = ONBOARDING_QUESTIONS[result.nextStep] as string
    if (typeof assistantResponse === 'function') {
      assistantResponse = assistantResponse(updatedState.extractedData.goalType || '')
    }
  }

  // Add assistant response to history
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
```

### API Integration

```typescript
// File: app/api/onboarding/message/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { processOnboardingMessage } from '@/lib/ai/onboarding-handler'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message } = await req.json()

  // Load current onboarding state
  let state = await loadOnboardingState(session.user.id)

  // Process message
  const result = await processOnboardingMessage(state, message)

  // Save updated state
  await saveOnboardingState(session.user.id, result.updatedState)

  // If complete, create AthleteProfile
  if (result.nextStep === 'complete') {
    await prisma.athleteProfile.create({
      data: {
        userId: session.user.id,
        goal: result.updatedState.extractedData.goal!,
        goalType: result.updatedState.extractedData.goalType!,
        goalDate: new Date(result.updatedState.extractedData.goalDate!),
        currentLevel: result.updatedState.extractedData.currentLevel!,
        availability: result.updatedState.extractedData.availability!,
        injuryHistory: result.updatedState.extractedData.injuryHistory || [],
        riskProfile: result.updatedState.extractedData.riskProfile!,
        onboardingCompleted: true,
      },
    })
  }

  return NextResponse.json({
    message: result.assistantResponse,
    nextStep: result.nextStep,
    isComplete: result.nextStep === 'complete',
  })
}

// Helper functions
async function loadOnboardingState(userId: string): Promise<ConversationState> {
  // Could store in Redis for better performance
  // For now, use database or in-memory cache
  const cached = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      athleteProfile: {
        select: {
          onboardingStep: true,
          // ... other fields
        }
      }
    },
  })

  return {
    userId,
    currentStep: 'welcome', // or load from cache
    extractedData: {},
    conversationHistory: [],
  }
}

async function saveOnboardingState(userId: string, state: ConversationState): Promise<void> {
  // Save to cache/database
}
```

---

## 3. Context Understanding

### Multi-Turn Conversations

The engine must maintain context across multiple messages:

```typescript
interface ConversationContext {
  conversationId: string
  userId: string
  type: 'onboarding' | 'constraint_entry' | 'feedback' | 'question'
  startedAt: Date
  lastMessageAt: Date
  messageCount: number
  state: Record<string, any>
  resolved: boolean
}

// Context Manager
class ConversationContextManager {
  private cache: Map<string, ConversationContext> = new Map()

  async getContext(conversationId: string): Promise<ConversationContext | null> {
    // Check cache first
    if (this.cache.has(conversationId)) {
      return this.cache.get(conversationId)!
    }

    // Load from database/Redis
    // ...
    return null
  }

  async updateContext(conversationId: string, updates: Partial<ConversationContext>): Promise<void> {
    const context = await this.getContext(conversationId)
    if (!context) throw new Error('Context not found')

    const updated = { ...context, ...updates, lastMessageAt: new Date() }
    this.cache.set(conversationId, updated)

    // Persist to database
    // ...
  }

  async resolveContext(conversationId: string): Promise<void> {
    await this.updateContext(conversationId, { resolved: true })
    // Clean up cache after some time
    setTimeout(() => {
      this.cache.delete(conversationId)
    }, 1000 * 60 * 30) // 30 minutes
  }
}
```

---

## 4. Clarification Logic

### When to Ask Clarifying Questions

```typescript
function shouldClarify(
  extractedData: any,
  confidence: number,
  userInput: string
): { should: boolean; questions: string[] } {

  const questions: string[] = []

  // Low confidence overall
  if (confidence < 0.7) {
    questions.push("Kannst du das nochmal genauer beschreiben?")
    return { should: true, questions }
  }

  // Ambiguous dates
  if (extractedData.dateRanges) {
    const hasAmbiguousDates = extractedData.dateRanges.some(
      (range: any) => !range.start || !range.end
    )
    if (hasAmbiguousDates) {
      questions.push("An welchen genauen Daten ist das? (z.B. 18.-20. November)")
    }
  }

  // Missing critical equipment for travel
  if (extractedData.type === 'travel' && !extractedData.equipment) {
    questions.push("Hast du dort Zugang zu einem Fitnessstudio, Pool oder Laufstrecken?")
  }

  // Injury without severity
  if (extractedData.type === 'injury' && !extractedData.severity) {
    questions.push("Ist es eine leichte Beschwerde oder solltest du komplett pausieren?")
  }

  return {
    should: questions.length > 0,
    questions,
  }
}
```

---

## 5. Frontend Integration

### Chat Interface Component

```typescript
// File: app/components/onboarding/chat-interface.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function OnboardingChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial message
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Hey! 👋 Ich bin dein persönlicher Trainingsassistent.\n\nLass uns mit dem Wichtigsten starten: **Was ist dein Ziel?**`,
        timestamp: new Date(),
      },
    ])
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
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

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      // If complete, redirect to dashboard
      if (data.isComplete) {
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
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
          rows={3}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          Senden
        </Button>
      </div>
    </div>
  )
}
```

---

## 6. Cost Optimization

### Prompt Caching

```typescript
// Use prompt caching for repeated system prompts
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: LONG_SYSTEM_PROMPT, // This will be cached
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [...],
})
```

### Model Selection

```typescript
// Use Haiku for simple classification, Sonnet for complex reasoning
async function parseSimpleConstraint(input: string) {
  // If input is simple (e.g., just a date), use Haiku
  if (isSimpleInput(input)) {
    return parseWithHaiku(input) // Cheaper
  }
  return parseWithSonnet(input) // More accurate
}
```

---

## 7. Error Handling

```typescript
async function safeAIParse<T>(
  parseFunction: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await parseFunction()
  } catch (error) {
    console.error('AI parsing failed:', error)

    // Log to monitoring
    // trackError('ai_parse_failure', { error })

    // Return fallback or ask user to rephrase
    return fallback
  }
}
```

---

**Next:** Feedback Analysis Engine

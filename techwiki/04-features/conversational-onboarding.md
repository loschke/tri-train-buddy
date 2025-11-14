# Conversational Onboarding

## Overview

Replace traditional multi-step forms with a natural conversation that feels like talking to a coach. This is a **core differentiator** and sets the tone for the entire app experience.

**Goals:**
1. Extract all required athlete data through conversation
2. Infer experience level from how they describe their training
3. Make onboarding feel personal and engaging
4. Set expectations for the educational approach
5. Complete in 3-5 minutes

---

## User Flow

```
1. Welcome Screen
   ↓
2. Goal Question (Open-ended)
   ↓
3. Current Level (Conversational)
   ↓
4. Availability (Natural language)
   ↓
5. Injury History (Safety check)
   ↓
6. Confirmation & Summary
   ↓
7. First Plan Generation
   ↓
8. Dashboard
```

---

## 1. Welcome Screen

### Design

```typescript
// File: app/onboarding/page.tsx

export default function OnboardingWelcome() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto p-8 text-center space-y-6">
        {/* Logo/Branding */}
        <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto flex items-center justify-center">
          <span className="text-4xl">🏃</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold text-gray-900">
          Willkommen bei Tri-Train-Buddy
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-gray-600">
          Dein persönlicher AI-Trainer für maßgeschneiderte Trainingspläne
        </p>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <span className="text-3xl">🎯</span>
            <h3 className="font-semibold mt-2">Dein Ziel</h3>
            <p className="text-sm text-gray-600">
              Marathon, Triathlon, oder einfach fitter werden
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <span className="text-3xl">📅</span>
            <h3 className="font-semibold mt-2">Dein Leben</h3>
            <p className="text-sm text-gray-600">
              Pläne passen sich deinem Alltag an
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <span className="text-3xl">🧠</span>
            <h3 className="font-semibold mt-2">Du lernst</h3>
            <p className="text-sm text-gray-600">
              Verstehe das "Warum" hinter jedem Training
            </p>
          </div>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={() => router.push('/onboarding/chat')}
          className="mt-8"
        >
          Los geht's! 🚀
        </Button>

        {/* Time estimate */}
        <p className="text-sm text-gray-500">
          Dauert nur 3-5 Minuten
        </p>
      </div>
    </div>
  )
}
```

---

## 2. Chat Interface Implementation

### Component Structure

```typescript
// File: app/onboarding/chat/page.tsx

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

interface OnboardingStep {
  step: 'goal' | 'current_level' | 'availability' | 'injury_history' | 'confirmation' | 'complete'
  progress: number // 0-100
}

export default function OnboardingChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>({
    step: 'goal',
    progress: 0,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: `Hey! 👋 Ich bin dein persönlicher Trainingsassistent.

Ich helfe dir dabei, einen maßgeschneiderten Trainingsplan zu erstellen, der zu deinem Leben passt.

Lass uns mit dem Wichtigsten starten: **Was ist dein Ziel?**

(z.B. "Ich möchte im April 2026 den Hamburg Marathon laufen" oder "Ich will meinen ersten Ironman schaffen")`,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    // Add user message
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
        body: JSON.stringify({
          message: input,
          currentStep: currentStep.step,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      // Update step
      setCurrentStep({
        step: data.nextStep,
        progress: data.progress || currentStep.progress,
      })

      // If complete, redirect to generating plan
      if (data.isComplete) {
        setTimeout(() => {
          router.push('/onboarding/generating')
        }, 1500)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Entschuldigung, da ist etwas schiefgelaufen. Kannst du das nochmal versuchen?',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Setup: {getStepLabel(currentStep.step)}
            </span>
            <span className="text-sm text-gray-500">
              {currentStep.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${currentStep.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`max-w-[80%] p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </Card>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <Card className="p-4 bg-white border">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-500">Denke nach...</span>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto p-4">
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
              className="flex-1 resize-none"
              rows={2}
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Senden'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enter zum Senden, Shift+Enter für neue Zeile
          </p>
        </div>
      </div>
    </div>
  )
}

function getStepLabel(step: string): string {
  const labels: Record<string, string> = {
    goal: 'Dein Ziel',
    current_level: 'Aktuelles Level',
    availability: 'Verfügbarkeit',
    injury_history: 'Gesundheits-Check',
    confirmation: 'Bestätigung',
    complete: 'Fertig!',
  }
  return labels[step] || step
}
```

---

## 3. Backend API

### Message Handler

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

  const { message, currentStep } = await req.json()

  // Load or create conversation state
  let state = await loadOnboardingState(session.user.id)

  if (!state) {
    state = {
      userId: session.user.id,
      currentStep: 'goal',
      extractedData: {},
      conversationHistory: [],
    }
  }

  // Process message
  const result = await processOnboardingMessage(state, message)

  // Save updated state
  await saveOnboardingState(session.user.id, result.updatedState)

  // Calculate progress
  const progress = calculateProgress(result.nextStep)

  // If complete, create AthleteProfile
  if (result.nextStep === 'complete') {
    await createAthleteProfile(session.user.id, result.updatedState.extractedData)
  }

  return NextResponse.json({
    message: result.assistantResponse,
    nextStep: result.nextStep,
    progress,
    isComplete: result.nextStep === 'complete',
  })
}

function calculateProgress(step: string): number {
  const progressMap: Record<string, number> = {
    welcome: 0,
    goal: 20,
    current_level: 40,
    availability: 60,
    injury_history: 80,
    confirmation: 90,
    complete: 100,
  }
  return progressMap[step] || 0
}

async function loadOnboardingState(userId: string): Promise<ConversationState | null> {
  // Check if profile already exists
  const profile = await prisma.athleteProfile.findUnique({
    where: { userId },
  })

  if (profile?.onboardingCompleted) {
    return null // Already completed
  }

  // Load from cache (Redis) or create new
  // For MVP, could use in-memory Map
  const cache = onboardingCache.get(userId)
  return cache || null
}

async function saveOnboardingState(
  userId: string,
  state: ConversationState
): Promise<void> {
  // Save to cache
  onboardingCache.set(userId, state)

  // Persist to database
  await prisma.user.update({
    where: { id: userId },
    data: {
      athleteProfile: {
        upsert: {
          create: {
            onboardingStep: getStepNumber(state.currentStep),
            onboardingCompleted: false,
          },
          update: {
            onboardingStep: getStepNumber(state.currentStep),
          },
        },
      },
    },
  })
}

async function createAthleteProfile(
  userId: string,
  extractedData: any
): Promise<void> {
  await prisma.athleteProfile.upsert({
    where: { userId },
    create: {
      userId,
      goal: extractedData.goal!,
      goalType: extractedData.goalType!,
      goalDate: new Date(extractedData.goalDate!),
      currentLevel: extractedData.currentLevel!,
      availability: extractedData.availability!,
      injuryHistory: extractedData.injuryHistory || [],
      riskProfile: extractedData.riskProfile || 'MODERATE',
      learnedPreferences: {},
      onboardingCompleted: true,
      onboardingStep: 100,
    },
    update: {
      goal: extractedData.goal!,
      goalType: extractedData.goalType!,
      goalDate: new Date(extractedData.goalDate!),
      currentLevel: extractedData.currentLevel!,
      availability: extractedData.availability!,
      injuryHistory: extractedData.injuryHistory || [],
      riskProfile: extractedData.riskProfile || 'MODERATE',
      onboardingCompleted: true,
      onboardingStep: 100,
    },
  })

  // Clear cache
  onboardingCache.delete(userId)
}

function getStepNumber(step: string): number {
  const stepMap: Record<string, number> = {
    welcome: 0,
    goal: 1,
    current_level: 2,
    availability: 3,
    injury_history: 4,
    confirmation: 5,
    complete: 6,
  }
  return stepMap[step] || 0
}

// Simple in-memory cache for MVP
const onboardingCache = new Map<string, ConversationState>()
```

---

## 4. Plan Generation Screen

### Loading State

```typescript
// File: app/onboarding/generating/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'

export default function GeneratingPlan() {
  const [status, setStatus] = useState<'analyzing' | 'generating' | 'validating' | 'complete'>('analyzing')
  const router = useRouter()

  useEffect(() => {
    generatePlan()
  }, [])

  async function generatePlan() {
    try {
      // Step 1: Analyzing profile
      setStatus('analyzing')
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Step 2: Generating plan
      setStatus('generating')
      const response = await fetch('/api/plans/generate', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to generate plan')

      // Step 3: Validating
      setStatus('validating')
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Step 4: Complete
      setStatus('complete')
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error generating plan:', error)
      router.push('/onboarding/error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
            {status === 'complete' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {status === 'complete' ? 'Fertig! 🎉' : 'Erstelle deinen Plan...'}
          </h2>

          <p className="text-gray-600">
            {getStatusMessage(status)}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3">
          <ProgressStep
            label="Profil analysieren"
            status={status === 'analyzing' ? 'active' : 'complete'}
          />
          <ProgressStep
            label="Trainingsplan generieren"
            status={
              status === 'analyzing'
                ? 'pending'
                : status === 'generating'
                ? 'active'
                : 'complete'
            }
          />
          <ProgressStep
            label="Plan validieren"
            status={
              status === 'validating' || status === 'complete'
                ? status === 'validating'
                  ? 'active'
                  : 'complete'
                : 'pending'
            }
          />
        </div>
      </Card>
    </div>
  )
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    analyzing: 'Analysiere dein Profil und Ziele...',
    generating: 'KI erstellt deinen maßgeschneiderten Plan...',
    validating: 'Überprüfe Sicherheit und Progression...',
    complete: 'Dein Plan ist bereit!',
  }
  return messages[status] || ''
}

function ProgressStep({
  label,
  status,
}: {
  label: string
  status: 'pending' | 'active' | 'complete'
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${
          status === 'complete'
            ? 'bg-green-500'
            : status === 'active'
            ? 'bg-blue-500'
            : 'bg-gray-200'
        }`}
      >
        {status === 'complete' ? (
          <CheckCircle className="w-4 h-4 text-white" />
        ) : status === 'active' ? (
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        ) : (
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
        )}
      </div>
      <span
        className={`text-sm ${
          status === 'active' ? 'font-semibold text-gray-900' : 'text-gray-600'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
```

---

## 5. Testing & Validation

### Test Scenarios

```typescript
// File: tests/onboarding/scenarios.test.ts

describe('Conversational Onboarding', () => {
  it('should complete onboarding with minimal input', async () => {
    const conversation = [
      {
        user: 'Ich will Marathon Hamburg April 2026 laufen',
        expectStep: 'current_level',
      },
      {
        user: 'Ich laufe 3x die Woche so 10km',
        expectStep: 'availability',
      },
      {
        user: 'Morgens vor der Arbeit und am Wochenende',
        expectStep: 'injury_history',
      },
      {
        user: 'Keine Verletzungen',
        expectStep: 'confirmation',
      },
      {
        user: 'Ja, passt!',
        expectStep: 'complete',
      },
    ]

    for (const turn of conversation) {
      const response = await sendMessage(turn.user)
      expect(response.nextStep).toBe(turn.expectStep)
    }
  })

  it('should handle ambiguous input with clarification', async () => {
    const response = await sendMessage('Ich will Marathon laufen')

    expect(response.needsClarification).toBe(true)
    expect(response.message).toContain('Welcher Marathon')
  })

  it('should infer experience from description', async () => {
    const response = await sendMessage(
      'Ich laufe seit 3 Jahren, mache 50km pro Woche mit Intervallen'
    )

    const extracted = await getExtractedData()
    expect(extracted.currentLevel.experience).toBe('advanced')
  })
})
```

---

## 6. UX Enhancements

### Quick Reply Buttons (Optional)

```typescript
// Add after tough questions for faster input

{currentStep.step === 'injury_history' && (
  <div className="flex flex-wrap gap-2 mt-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => setInput('Keine Verletzungen')}
    >
      Keine Verletzungen
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setInput('Knie-Probleme in der Vergangenheit')}
    >
      Knie-Probleme
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setInput('Andere')}
    >
      Andere
    </Button>
  </div>
)}
```

---

## Summary

Conversational onboarding creates a welcoming, personal experience that:
1. **Feels natural** - Like talking to a coach
2. **Extracts data** - Gets all required information
3. **Sets expectations** - Shows the app is smart and personal
4. **Builds trust** - Demonstrates AI capabilities upfront
5. **Reduces friction** - No multi-page forms

**Success Metrics:**
- < 5 minutes completion time
- > 90% completion rate
- > 80% accuracy in data extraction
- Positive sentiment in user feedback

---

**Next:** Dashboard with Insights

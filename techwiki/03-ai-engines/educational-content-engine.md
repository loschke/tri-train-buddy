# Educational Content Engine

## Overview

The Educational Content Engine transforms Tri-Train-Buddy from a plan generator into a **personal coach** that teaches athletes the "why" behind every workout. This is a core differentiator and critical to the "Hobbyathleten-Positioning."

**Key Principles:**
1. **Progressive Disclosure** - Teach concepts when relevant, not all at once
2. **Context-Aware** - Educational content adapts to athlete's level and experience
3. **"Why" for Every Workout** - Never just "do this" - always explain purpose
4. **Learning Moments** - Transform feedback and mistakes into teaching opportunities
5. **Gamified Learning** - Track "knowledge unlocks" as achievements

---

## Architecture

```
Workout Generation
        ↓
   Educational Layer
        ↓
   ┌────────────┬────────────┬────────────┐
   │            │            │            │
  Why?      How to      When is     What's
(Purpose) (Execute)  (First Time)  (Next)
   │            │            │            │
   └────────────┴────────────┴────────────┘
        ↓
   Progressive Disclosure
   (Show if first time)
        ↓
   Knowledge Graph
   (Track what athlete knows)
```

---

## 1. Educational Content Structure

### Workout Explanation Fields

```typescript
interface EducationalWorkout extends Workout {
  // Core fields
  title: string             // "Easy Run"
  description: string       // What to do

  // Educational layer
  explanation: string       // Why am I doing this?
  executionTips: string     // How to do it well
  isFirstOfType: boolean    // First time doing this workout type

  // Progressive education
  conceptsIntroduced: string[]  // e.g., ["zone-2-training", "aerobic-base"]
  relatedConcepts: string[]     // Links to training wiki

  // What's next
  progression: {
    current: string         // Current workout
    next: string           // What comes after
    rationale: string      // Why this progression
  }
}
```

---

## 2. Content Generation

### Generate "Why" Explanation

```typescript
// File: app/lib/ai/educational-content.ts

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
  workout: Workout,
  athleteContext: {
    experience: 'beginner' | 'intermediate' | 'advanced'
    goal: string
    currentPhase: TrainingPhase
    isFirstOfType: boolean
    knownConcepts: string[]
  },
  trainingPhase: TrainingPhase
): Promise<z.infer<typeof EducationalContentSchema>> {

  // Load relevant trainwiki content
  const wikiContext = await loadRelevantWiki(workout, trainingPhase)

  const systemPrompt = `You are an expert endurance coach creating educational content for workouts.

**Your goal**: Help the athlete understand WHY they're doing this workout and HOW to execute it well.

**Athlete Context:**
- Experience: ${athleteContext.experience}
- Goal: ${athleteContext.goal}
- Training Phase: ${athleteContext.currentPhase}
- Known Concepts: ${athleteContext.knownConcepts.join(', ')}
- First time doing this type: ${athleteContext.isFirstOfType}

**Workout:**
- Type: ${workout.type}
- Discipline: ${workout.discipline}
- Duration: ${workout.durationMin} min
- Intensity: ${workout.intensityZone}
- Description: ${workout.description}

**Training Phase Context:**
${trainingPhase === 'BASE' ? 'Focus: Building aerobic foundation, injury prevention, sustainable volume' : ''}
${trainingPhase === 'BUILD' ? 'Focus: Adding intensity, sport-specific fitness, increasing load' : ''}
${trainingPhase === 'PEAK' ? 'Focus: Race-specific work, fine-tuning, maintaining fitness' : ''}
${trainingPhase === 'TAPER' ? 'Focus: Recovery, freshness, maintaining sharpness' : ''}

**Relevant Training Science:**
${wikiContext}

---

## Content Guidelines

### Explanation (Why am I doing this?)
- Start with the PURPOSE in one sentence
- Explain the physiological adaptation (for intermediate/advanced)
- Connect to their specific goal
- Keep it motivating and clear
- Length: 2-4 sentences

Examples:
- Beginner: "This easy run builds your aerobic base - the foundation for all endurance. Your body learns to burn fat for fuel and your heart gets stronger without stress."
- Intermediate: "Z2 work maximizes mitochondrial density and capillary development. This is where 80% of your fitness gains come from, not the hard stuff!"

### Execution Tips (How to do it well)
- Practical, actionable advice
- Intensity guidance (how should it feel)
- Common mistakes to avoid
- First-time tips if isFirstOfType = true

Examples:
- "Keep the pace conversational - you should be able to talk in full sentences"
- "If using a treadmill, set 1% incline to simulate outdoor running"
- "Don't worry about pace - focus on effort and heart rate"

### Concepts Introduced
- Only new concepts (not in knownConcepts array)
- Simple, searchable terms
- Link to trainwiki pages

Examples:
- "zone-2-training"
- "long-run-nutrition"
- "threshold-pace"

### Progression
- What comes next and why
- Build confidence by showing the path forward

Example:
- Current: "2x20min Z3 tempo"
- Next: "In 2-3 weeks: 3x20min Z3 or 2x25min - more work capacity"
- Rationale: "Once this feels manageable, we'll add volume before intensity"

---

## Tone & Style
- Encouraging but honest
- Use analogies for complex concepts
- Avoid jargon (or explain it simply)
- German language, casual but professional (Du-Form)
- Use emojis sparingly for emphasis

Return JSON matching the schema.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
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

async function loadRelevantWiki(
  workout: Workout,
  phase: TrainingPhase
): Promise<string> {
  // Load relevant trainwiki pages based on workout type
  const wikiPages: string[] = []

  // Core principles
  wikiPages.push('core/80-20-rule.md')

  // Workout type specific
  if (workout.type === 'EASY' || workout.type === 'LONG') {
    wikiPages.push('core/recovery.md')
  }
  if (workout.type === 'THRESHOLD' || workout.type === 'INTERVALS') {
    wikiPages.push('core/load-management.md')
  }

  // Sport specific
  if (workout.discipline === 'RUN') {
    wikiPages.push('sports/running.md')
  } else if (workout.discipline === 'BIKE') {
    wikiPages.push('sports/cycling.md')
  } else if (workout.discipline === 'SWIM') {
    wikiPages.push('sports/swimming.md')
  }

  // Load and concatenate
  const fs = require('fs').promises
  const path = require('path')

  const content = await Promise.all(
    wikiPages.map(async (page) => {
      const filePath = path.join(process.cwd(), 'trainwiki', page)
      try {
        return await fs.readFile(filePath, 'utf-8')
      } catch {
        return ''
      }
    })
  )

  return content.join('\n\n---\n\n').slice(0, 4000) // Limit to ~4k chars
}
```

---

## 3. Progressive Disclosure System

### Knowledge Graph Tracking

```typescript
// File: app/lib/ai/knowledge-graph.ts

interface KnowledgeNode {
  id: string              // "zone-2-training"
  title: string           // "Zone 2 Training"
  category: 'concept' | 'workout-type' | 'technique' | 'nutrition' | 'recovery'
  prerequisites: string[] // Other concepts needed first
  introducedAt?: Date     // When athlete first encountered
  reinforced: number      // How many times seen
  mastered: boolean       // Athlete demonstrates understanding
}

class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map()

  constructor() {
    this.initializeGraph()
  }

  private initializeGraph() {
    // Core concepts
    this.addNode({
      id: 'zone-2-training',
      title: 'Zone 2 Training',
      category: 'concept',
      prerequisites: [],
      reinforced: 0,
      mastered: false,
    })

    this.addNode({
      id: 'threshold-pace',
      title: 'Threshold Pace',
      category: 'concept',
      prerequisites: ['zone-2-training'],
      reinforced: 0,
      mastered: false,
    })

    this.addNode({
      id: 'interval-training',
      title: 'Interval Training',
      category: 'workout-type',
      prerequisites: ['threshold-pace'],
      reinforced: 0,
      mastered: false,
    })

    this.addNode({
      id: 'long-run-nutrition',
      title: 'Long Run Nutrition',
      category: 'nutrition',
      prerequisites: ['zone-2-training'],
      reinforced: 0,
      mastered: false,
    })

    // ... add all core concepts
  }

  addNode(node: KnowledgeNode) {
    this.nodes.set(node.id, node)
  }

  async introduceConceptToAthlete(
    userId: string,
    conceptId: string
  ): Promise<void> {
    const node = this.nodes.get(conceptId)
    if (!node) return

    // Check prerequisites
    const prerequisitesMet = await this.checkPrerequisites(userId, node.prerequisites)
    if (!prerequisitesMet) {
      console.warn(`Prerequisites not met for ${conceptId}`)
      return
    }

    // Mark as introduced
    await prisma.athleteKnowledge.upsert({
      where: {
        userId_conceptId: {
          userId,
          conceptId,
        },
      },
      create: {
        userId,
        conceptId,
        introducedAt: new Date(),
        reinforced: 1,
        mastered: false,
      },
      update: {
        reinforced: {
          increment: 1,
        },
      },
    })

    // Unlock achievement if first concept in category
    const categoryCount = await prisma.athleteKnowledge.count({
      where: {
        userId,
        concept: {
          category: node.category,
        },
      },
    })

    if (categoryCount === 1) {
      await this.unlockAchievement(userId, `first-${node.category}-concept`)
    }
  }

  async checkPrerequisites(
    userId: string,
    prerequisites: string[]
  ): Promise<boolean> {
    if (prerequisites.length === 0) return true

    const known = await prisma.athleteKnowledge.count({
      where: {
        userId,
        conceptId: {
          in: prerequisites,
        },
      },
    })

    return known === prerequisites.length
  }

  async getKnownConcepts(userId: string): Promise<string[]> {
    const knowledge = await prisma.athleteKnowledge.findMany({
      where: { userId },
      select: { conceptId: true },
    })

    return knowledge.map((k) => k.conceptId)
  }

  async unlockAchievement(userId: string, achievementType: string): Promise<void> {
    // Create achievement
    // (Implementation in gamification section)
  }
}

export const knowledgeGraph = new KnowledgeGraph()
```

### Database Schema Addition

```prisma
// Add to schema.prisma

model AthleteKnowledge {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  conceptId     String   // "zone-2-training"
  introducedAt  DateTime @default(now())
  reinforced    Int      @default(1)
  mastered      Boolean  @default(false)

  @@unique([userId, conceptId])
  @@index([userId])
}
```

---

## 4. Contextual Help System

### In-Workout Guidance

```typescript
// File: app/components/workout/contextual-help.tsx

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react'

interface ContextualHelpProps {
  workout: EducationalWorkout
  isFirstOfType: boolean
}

export function ContextualHelp({ workout, isFirstOfType }: ContextualHelpProps) {
  const [showExplanation, setShowExplanation] = useState(isFirstOfType)
  const [showTips, setShowTips] = useState(false)

  return (
    <div className="space-y-3">
      {/* Why Section - Always visible for first-time workouts */}
      <Card className={`p-4 ${isFirstOfType ? 'border-blue-500 border-2' : ''}`}>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold">Warum mache ich das?</h4>
          </div>
          {showExplanation ? <ChevronUp /> : <ChevronDown />}
        </button>

        {showExplanation && (
          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <p>{workout.explanation}</p>

            {isFirstOfType && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">
                  ✨ Neuer Workout-Typ!
                </p>
                <p className="text-xs text-blue-800">
                  Das ist das erste Mal, dass du diesen Typ machst. Nimm dir Zeit, die Ausführung zu verstehen.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Execution Tips */}
      <Card className="p-4">
        <button
          onClick={() => setShowTips(!showTips)}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="font-semibold">Wie führe ich es aus?</h4>
          {showTips ? <ChevronUp /> : <ChevronDown />}
        </button>

        {showTips && (
          <div className="mt-3 text-sm text-gray-700">
            <p>{workout.executionTips}</p>
          </div>
        )}
      </Card>

      {/* Progression */}
      {workout.progression && (
        <Card className="p-4 bg-gray-50">
          <h4 className="font-semibold text-sm mb-2">Was kommt als nächstes?</h4>
          <p className="text-xs text-gray-600">
            {workout.progression.next}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {workout.progression.rationale}
          </p>
        </Card>
      )}
    </div>
  )
}
```

---

## 5. Learning Moments from Feedback

### Transform Mistakes into Education

```typescript
// File: app/lib/ai/learning-moments.ts

export async function generateLearningMoment(
  feedback: WorkoutFeedback,
  workout: Workout
): Promise<string | null> {

  // Pattern: Went out too hard on easy run
  if (
    workout.type === 'EASY' &&
    feedback.perceivedDifficulty >= 7 &&
    feedback.notes?.toLowerCase().includes('zu schnell')
  ) {
    return `**Klassischer Fehler: Zu schnell gestartet! 🏃💨**

Easy Runs sollen EASY sein. Ein häufiger Fehler (selbst bei erfahrenen Athleten!) ist, zu schnell zu starten.

**Warum passiert das?**
- Du fühlst dich frisch und motiviert
- Die ersten Kilometer fühlen sich leicht an
- Andere Läufer überholen dich (Ego 😄)

**Das Problem:**
Wenn du zu schnell läufst, verlässt du Zone 2 → andere Energiesysteme → weniger aerobe Entwicklung → mehr Ermüdung.

**Tipp fürs nächste Mal:**
Starte langsamer als du denkst. Die ersten 10 Minuten sollten sich fast lächerlich langsam anfühlen. Dann steigere *vielleicht* etwas, aber bleib in Z2.

Motto: **"Easy means EASY"** 😊`
  }

  // Pattern: Skipped warmup
  if (
    workout.type === 'INTERVALS' &&
    feedback.notes?.toLowerCase().includes('kein warmup')
  ) {
    return `**Warmup ist nicht optional! 🔥**

Ich sehe, du hast das Warmup übersprungen. Bei Intervallen ist das riskant:

**Was ein Warmup macht:**
- Erhöht Muskeltemperatur (bessere Kontraktionsfähigkeit)
- Öffnet Kapillaren (mehr Sauerstoff zu Muskeln)
- Aktiviert Nervensystem (bessere Koordination)
- Reduziert Verletzungsrisiko massiv

**Ohne Warmup:**
- Erste Intervalle fühlen sich härter an
- Höheres Risiko für Zerrungen
- Schlechtere Performance

**Minimum-Warmup:**
10 Minuten Z1-Z2 + 3-4 kurze Steigerungen (20 Sekunden progressiv schneller werden)

Versprochen: Mit Warmup läufst du bessere Zeiten! ⚡`
  }

  return null
}
```

---

## 6. Interactive Concept Explorer

### Wiki Integration

```typescript
// File: app/components/training/concept-explorer.tsx

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Concept {
  id: string
  title: string
  category: string
  introducedAt: Date
  reinforced: number
  wikiLink: string
}

export function ConceptExplorer({ concepts }: { concepts: Concept[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dein Trainingswissen 📚</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {concepts.map((concept) => (
          <Link key={concept.id} href={`/wiki/${concept.id}`}>
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm">{concept.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Gelernt am {concept.introducedAt.toLocaleDateString('de-DE')}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {concept.reinforced}x gesehen
                </Badge>
              </div>
              <Badge className="mt-2 text-xs">{concept.category}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

### Wiki Page with Breadcrumbs

```typescript
// File: app/wiki/[conceptId]/page.tsx

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'

export default async function WikiPage({
  params,
}: {
  params: { conceptId: string }
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/login')
  }

  // Load concept
  const concept = await prisma.athleteKnowledge.findUnique({
    where: {
      userId_conceptId: {
        userId: session.user.id,
        conceptId: params.conceptId,
      },
    },
  })

  // Load wiki content
  const wikiContent = await loadWikiContent(params.conceptId)

  // Related workouts
  const relatedWorkouts = await prisma.workout.findMany({
    where: {
      userId: session.user.id,
      // conceptsIntroduced would need to be added to schema
    },
    take: 5,
    orderBy: { date: 'desc' },
  })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500">
        <Link href="/dashboard">Dashboard</Link> /
        <Link href="/wiki">Wiki</Link> /
        {params.conceptId}
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{concept?.conceptId}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge>Gelernt am {concept?.introducedAt.toLocaleDateString('de-DE')}</Badge>
          <Badge variant="secondary">{concept?.reinforced}x angewendet</Badge>
        </div>
      </div>

      {/* Content */}
      <Card className="p-6 prose max-w-none">
        <ReactMarkdown>{wikiContent}</ReactMarkdown>
      </Card>

      {/* Related Workouts */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Wo du das angewendet hast</h3>
        <div className="space-y-2">
          {relatedWorkouts.map((workout) => (
            <Link key={workout.id} href={`/workouts/${workout.id}`}>
              <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <p className="text-sm font-medium">{workout.title}</p>
                <p className="text-xs text-gray-500">
                  {workout.date.toLocaleDateString('de-DE')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}

async function loadWikiContent(conceptId: string): Promise<string> {
  // Map concept IDs to trainwiki files
  const conceptMap: Record<string, string> = {
    'zone-2-training': 'core/80-20-rule.md',
    'threshold-pace': 'sports/running.md',
    'interval-training': 'core/periodization.md',
    // ... etc
  }

  const wikiFile = conceptMap[conceptId]
  if (!wikiFile) return 'Content not found'

  const fs = require('fs').promises
  const path = require('path')
  const filePath = path.join(process.cwd(), 'trainwiki', wikiFile)

  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return 'Content not found'
  }
}
```

---

## 7. Gamification of Learning

### Knowledge-Based Achievements

```typescript
// File: app/lib/gamification/knowledge-achievements.ts

export async function checkKnowledgeAchievements(
  userId: string,
  conceptId: string
): Promise<void> {

  const knownCount = await prisma.athleteKnowledge.count({
    where: { userId },
  })

  // First concept learned
  if (knownCount === 1) {
    await unlockAchievement(userId, {
      type: 'FIRST_CONCEPT',
      tier: 1,
      title: 'Wissbegierig 📖',
      description: 'Erstes Trainingskonzept gelernt',
      icon: '📖',
    })
  }

  // 10 concepts learned
  if (knownCount === 10) {
    await unlockAchievement(userId, {
      type: 'TEN_CONCEPTS',
      tier: 2,
      title: 'Training Nerd 🤓',
      description: '10 Trainingskonzepte gemeistert',
      icon: '🤓',
    })
  }

  // All core concepts mastered
  const coreConcepts = ['zone-2-training', 'threshold-pace', 'interval-training', 'recovery', 'periodization']
  const masteredCore = await prisma.athleteKnowledge.count({
    where: {
      userId,
      conceptId: { in: coreConcepts },
      mastered: true,
    },
  })

  if (masteredCore === coreConcepts.length) {
    await unlockAchievement(userId, {
      type: 'CORE_MASTER',
      tier: 3,
      title: 'Trainings-Experte 🎓',
      description: 'Alle Kern-Konzepte gemeistert',
      icon: '🎓',
    })
  }
}
```

---

## 8. API Routes

### Get Educational Content for Workout

```typescript
// File: app/api/workouts/[id]/education/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { generateEducationalContent } from '@/lib/ai/educational-content'
import { knowledgeGraph } from '@/lib/ai/knowledge-graph'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workout = await prisma.workout.findUnique({
    where: { id: params.id },
    include: { plan: true },
  })

  if (!workout) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const knownConcepts = await knowledgeGraph.getKnownConcepts(session.user.id)

  const educationalContent = await generateEducationalContent(
    workout,
    {
      experience: (profile.currentLevel as any).experience,
      goal: profile.goal,
      currentPhase: workout.plan.phase,
      isFirstOfType: workout.isFirstOfType,
      knownConcepts,
    },
    workout.plan.phase
  )

  // Track new concepts
  for (const concept of educationalContent.conceptsIntroduced) {
    await knowledgeGraph.introduceConceptToAthlete(session.user.id, concept)
  }

  return NextResponse.json(educationalContent)
}
```

---

## Summary

The Educational Content Engine transforms every interaction into a learning opportunity:

1. **"Why" for every workout** - Purpose-driven training
2. **Progressive disclosure** - Teach when relevant
3. **Knowledge graph** - Track and build on what athlete knows
4. **Learning moments** - Turn feedback into education
5. **Gamification** - Reward curiosity and understanding

This makes Tri-Train-Buddy not just a tool, but a **coach that teaches**.

---

**Next:** Feature Implementation Guides

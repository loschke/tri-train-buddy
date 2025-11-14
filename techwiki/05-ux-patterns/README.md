# UX Patterns

## Overview

This directory documents the **core UX patterns** used throughout Tri-Train-Buddy to ensure consistency, usability, and a delightful user experience.

**Key Principles:**
1. **Conversational First** - Natural language over forms
2. **Progressive Disclosure** - Show what's needed, when needed
3. **Educational Layer** - Always explain "why"
4. **Mobile-First** - Design for smallest screen first
5. **Accessible** - WCAG 2.1 AA compliance

---

## Pattern Categories

### 1. **Conversational Patterns**
- Chat interfaces
- Natural language input
- Clarification flows
- Confirmation patterns

### 2. **Educational Patterns**
- "Why" explanations
- Expandable help sections
- Inline tips
- Learning moments

### 3. **Feedback Patterns**
- Workout feedback collection
- Rating systems
- Free-form notes
- Quick responses

### 4. **Motivation Patterns**
- Achievement notifications
- Streak displays
- Progress visualization
- Encouragement messages

### 5. **Navigation Patterns**
- Bottom navigation (mobile)
- Contextual actions
- Quick links
- Breadcrumbs

---

## Common Components

### Loading States

```typescript
// Skeleton Loading
<Card className="p-6 animate-pulse">
  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
  <div className="h-4 bg-gray-200 rounded w-5/6" />
</Card>

// Spinner with Message
<div className="flex flex-col items-center gap-3">
  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  <p className="text-sm text-gray-600">Erstelle deinen Plan...</p>
</div>
```

### Error States

```typescript
// Friendly Error Message
<Card className="p-6 bg-red-50 border-2 border-red-200">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
    <div>
      <h3 className="font-semibold text-red-900 mb-1">
        Da ist etwas schiefgelaufen
      </h3>
      <p className="text-sm text-red-800 mb-3">
        {errorMessage || 'Bitte versuche es nochmal.'}
      </p>
      <Button variant="outline" size="sm" onClick={retry}>
        Nochmal versuchen
      </Button>
    </div>
  </div>
</Card>
```

### Empty States

```typescript
// No Workouts Yet
<div className="text-center p-12">
  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
    <Calendar className="w-10 h-10 text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    Noch keine Trainings
  </h3>
  <p className="text-gray-600 mb-4">
    Dein erster Trainingsplan wird gerade erstellt.
  </p>
  <Button onClick={goToDashboard}>
    Zum Dashboard
  </Button>
</div>
```

### Success States

```typescript
// Success Confirmation
<Card className="p-6 bg-green-50 border-2 border-green-200">
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
      <CheckCircle className="w-6 h-6 text-white" />
    </div>
    <div>
      <h3 className="font-semibold text-green-900">Gespeichert!</h3>
      <p className="text-sm text-green-800">
        Deine Änderungen wurden übernommen.
      </p>
    </div>
  </div>
</Card>
```

---

## Responsive Design

### Breakpoints

```css
/* Tailwind breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Desktops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Extra large */
```

### Mobile-First Approach

```typescript
// Stack on mobile, side-by-side on desktop
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div>
    {/* Sidebar */}
  </div>
</div>
```

---

## Accessibility

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Logical tab order
- Escape key closes modals/dialogs
- Enter key submits forms

### Screen Readers

```typescript
// Use semantic HTML and ARIA labels
<button aria-label="Training starten">
  <PlayCircle className="w-5 h-5" />
</button>

// Use proper heading hierarchy
<h1>Dashboard</h1>
<h2>Heutiges Training</h2>
<h3>Details</h3>
```

### Color Contrast

- Text: Minimum 4.5:1 contrast ratio
- UI Components: Minimum 3:1 contrast ratio
- Don't rely on color alone for meaning

---

## Animation Guidelines

### Duration

- Micro-interactions: 100-200ms
- Transitions: 200-300ms
- Page transitions: 300-500ms
- Never longer than 500ms

### Easing

```css
/* Use natural easing */
transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

/* Quick start, slow end */
transition: all 0.3s ease-out;

/* Slow start, quick end */
transition: all 0.3s ease-in;
```

---

## Tone & Voice

### Writing Guidelines

1. **Conversational** - Du-Form, friendly but professional
2. **Clear** - Avoid jargon, explain technical terms
3. **Encouraging** - Positive reinforcement
4. **Honest** - Don't oversell, set realistic expectations
5. **Concise** - Respect user's time

### Examples

**Good:**
- "Super gemacht! Du hast dein Training absolviert." ✅
- "Das ist das erste Mal, dass du Intervalle machst. Nimm dir Zeit, die Ausführung zu verstehen." ✅

**Bad:**
- "Workout completed successfully." ❌ (Too formal)
- "AMAZING JOB!!! YOU'RE THE BEST!!!" ❌ (Too over the top)
- "This is a high-intensity interval training session designed to improve VO2max." ❌ (Too technical without context)

---

## Dark Mode (Future)

### Color Tokens

```css
/* Define colors as CSS variables */
:root {
  --color-background: #ffffff;
  --color-text: #1f2937;
  --color-primary: #3b82f6;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1f2937;
    --color-text: #f9fafb;
    --color-primary: #60a5fa;
  }
}
```

---

## Performance

### Image Optimization

- Use Next.js `<Image>` component
- Provide width/height
- Use appropriate formats (WebP with fallback)
- Lazy load below-the-fold images

### Code Splitting

- Dynamic imports for heavy components
- Route-based splitting (automatic with Next.js App Router)
- Lazy load modals and dialogs

---

## Testing UX

### Usability Tests

1. **5-Second Test** - Can user understand page purpose in 5 seconds?
2. **First-Click Test** - Do users click correct element first try?
3. **A/B Testing** - Test variations of critical flows
4. **User Interviews** - Qualitative feedback on experience

### Metrics to Track

- **Time to First Action** - How quickly can user start first workout?
- **Completion Rate** - % of users who complete onboarding
- **Error Rate** - How often do users encounter errors?
- **User Satisfaction** - Post-interaction surveys (NPS, CSAT)

---

## File Structure

```
05-ux-patterns/
├── README.md (this file)
├── conversational-patterns.md
├── educational-patterns.md
├── feedback-patterns.md
└── mobile-navigation.md
```

---

**Next:** Detailed pattern documentation files

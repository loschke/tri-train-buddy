# TechWiki - Tri-Train-Buddy Technical Documentation

## Overview

This is the **comprehensive technical documentation** for Tri-Train-Buddy Version 2.0. It covers architecture, implementation details, AI engines, features, UX patterns, API design, and deployment strategy.

**Purpose:**
- Serve as the **single source of truth** for technical decisions
- Guide implementation of Version 2.0
- Onboard new developers
- Document AI-powered features and their rationale

---

## Quick Navigation

### 🏗️ [01. Architecture](./01-architecture/)
High-level system design and technical philosophy

- **[System Overview](./01-architecture/system-overview.md)** - Complete architecture, data flows, core principles, technical challenges

### 🗄️ [02. Database](./02-database/)
Database schema design and data modeling

- **[Schema Design](./02-database/schema-design.md)** - Complete Prisma schema, JSON structures, indexes, migrations

### 🤖 [03. AI Engines](./03-ai-engines/)
AI-powered features and implementation

- **[Plan Generation Engine](./03-ai-engines/plan-generation-engine.md)** - Core AI logic for creating training plans
- **[Conversational Interface Engine](./03-ai-engines/conversational-interface-engine.md)** - Natural language parsing and dialogues
- **[Feedback Analysis Engine](./03-ai-engines/feedback-analysis-engine.md)** - Learning from user feedback
- **[Educational Content Engine](./03-ai-engines/educational-content-engine.md)** - Progressive education and knowledge tracking

### ⚡ [04. Features](./04-features/)
Feature implementation guides

- **[Conversational Onboarding](./04-features/conversational-onboarding.md)** - Chat-based user onboarding flow
- **[Dashboard with Insights](./04-features/dashboard-with-insights.md)** - Main dashboard with AI insights
- **[Gamification System](./04-features/gamification-system.md)** - Achievements, streaks, motivation

### 🎨 [05. UX Patterns](./05-ux-patterns/)
User experience patterns and guidelines

- **[UX Patterns Overview](./05-ux-patterns/README.md)** - Common patterns, components, accessibility, tone & voice

### 🔌 [06. API Design](./06-api-design/)
API architecture and endpoints

- **[API Design Guide](./06-api-design/README.md)** - Server Actions, API Routes, authentication, validation, error handling

### 🚀 [07. Deployment](./07-deployment/)
Infrastructure and deployment strategy

- **[Deployment Strategy](./07-deployment/README.md)** - Vercel, Neon, Upstash, CI/CD, monitoring, costs

---

## Project Vision

**Tri-Train-Buddy** is an AI-powered training platform for endurance athletes (running, cycling, triathlon). Version 2.0 focuses on:

### Core Differentiators

1. **Conversational First**
   - Natural language onboarding (no multi-step forms)
   - Chat-based constraint entry
   - Ask questions in plain language

2. **Educational Layer**
   - Every workout explains the "why"
   - Progressive disclosure of training concepts
   - Knowledge graph tracking what you've learned

3. **AI That Learns**
   - Analyzes workout feedback for patterns
   - Adapts future plans based on your preferences
   - Detects overtraining risks early

4. **Hobbyathleten-Focused**
   - Designed for athletes with full-time jobs
   - Adapts to life constraints (travel, work, family)
   - Builds around your schedule, not the other way around

---

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library

### Backend
- **Next.js API Routes** - RESTful endpoints
- **Next.js Server Actions** - Mutations
- **Prisma ORM** - Database access
- **BetterAuth** - Authentication

### Database & Storage
- **Neon PostgreSQL** - Serverless database
- **Upstash Redis** - Caching (optional)
- **Vercel Blob** - File storage (future)

### AI & External Services
- **Anthropic Claude** - Sonnet 4 for AI features
- **Vercel AI SDK** - Structured outputs (Zod)

### Infrastructure
- **Vercel** - Hosting, deployments, edge functions
- **GitHub** - Version control, CI/CD

---

## Implementation Phases

### Phase 1: MVP ✅ (Current)
- Basic onboarding (form-based)
- Simple plan generation
- Workout tracking
- Manual feedback collection

### Phase 2: AI Features 🚧 (In Progress)
- Conversational onboarding
- Educational layer for workouts
- AI-powered insights on dashboard
- Feedback analysis and learning

### Phase 3: Gamification 📋 (Planned)
- Achievement system
- Streak tracking
- Progress visualization
- Social features (opt-in)

### Phase 4: Mobile & Polish 📋 (Future)
- Progressive Web App (PWA)
- Offline support
- Push notifications
- Mobile app (React Native)

---

## Key Files & Locations

```
tri-train-buddy/
├── app/                        # Next.js app directory
│   ├── api/                   # API routes
│   ├── actions/               # Server actions
│   ├── dashboard/             # Dashboard pages
│   ├── onboarding/            # Onboarding flow
│   └── lib/                   # Shared utilities
│       ├── ai/               # AI engines
│       ├── auth.ts           # Authentication
│       └── prisma.ts         # Database client
├── prisma/
│   └── schema.prisma         # Database schema
├── techwiki/                  # Technical documentation (this folder)
├── trainwiki/                 # Training knowledge base
├── docs/                      # User-facing documentation
└── components/                # Reusable UI components
```

---

## Core Concepts

### Training Phases
- **Base** (16+ weeks out) - Building foundation
- **Build** (8-16 weeks) - Adding intensity
- **Peak** (4-8 weeks) - Race-specific work
- **Taper** (0-4 weeks) - Recovery and freshness

### 80/20 Rule
- 80% of training in Zone 1-2 (easy)
- 20% in Zone 4-5 (hard)
- Minimal Zone 3 (no-man's land)

### Progressive Overload
- Never increase weekly volume by > 10%
- Respect the athlete's run tolerance (max km/week)
- Ensure recovery days between hard workouts

### Educational Philosophy
- **Progressive Disclosure** - Teach when relevant
- **"Why" for Everything** - Never just "do this"
- **Learn from Mistakes** - Transform feedback into education

---

## Development Workflow

### Getting Started

```bash
# Clone repository
git clone https://github.com/loschke/tri-train-buddy.git

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Add your API keys

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Start development server
npm run dev
```

### Branch Strategy

```
main                    # Production
├── claude/*           # AI-assisted development branches
├── feature/*          # New features
└── fix/*              # Bug fixes
```

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Enforce code quality
- **Prettier** - Code formatting
- **Conventional Commits** - Structured commit messages

---

## Testing Strategy

### Unit Tests
- **Vitest** - Unit testing framework
- Focus on utilities and business logic
- AI engine helper functions

### Integration Tests
- API route testing
- Database operations
- Server action flows

### E2E Tests (Future)
- **Playwright** - End-to-end testing
- Critical user flows (onboarding, plan generation)

---

## AI Features Deep Dive

### How AI is Used

1. **Plan Generation**
   - Input: Athlete profile, goals, constraints
   - Process: Claude generates 14-day plan with Zod validation
   - Output: Structured workouts with educational content

2. **Natural Language Parsing**
   - Input: "Nächste Woche Dienstreise München"
   - Process: Claude extracts dates, location, constraints
   - Output: Structured constraint object

3. **Feedback Analysis**
   - Input: Workout feedback over time
   - Process: Claude identifies patterns (recovery needs, intensity tolerance)
   - Output: Learned preferences with confidence scores

4. **Educational Content**
   - Input: Workout + athlete knowledge level
   - Process: Claude generates "why" explanation + execution tips
   - Output: Progressive educational content

### Cost Optimization

- **Prompt Caching** - Cache system prompts (90% cost reduction)
- **Model Selection** - Haiku for simple tasks, Sonnet for complex
- **Batch Processing** - Process multiple feedbacks together
- **Smart Triggering** - Only analyze when patterns are likely

---

## Security Considerations

### Authentication
- BetterAuth with email/password
- Session-based authentication
- Secure cookie handling

### Data Protection
- All user data encrypted at rest (Neon)
- SSL/TLS in transit (Vercel)
- No sensitive data in logs
- GDPR-compliant data handling

### API Security
- Authentication required on all endpoints
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS prevention (React)
- Rate limiting (future)

---

## Performance Targets

### Page Load
- **Dashboard** - < 1 second
- **Workout Detail** - < 500ms
- **Plan Generation** - < 10 seconds

### API Response
- **Simple queries** - < 100ms
- **AI operations** - < 5 seconds
- **Complex analytics** - < 2 seconds

### Mobile
- **Lighthouse Score** - > 90
- **First Contentful Paint** - < 1.5s
- **Time to Interactive** - < 3s

---

## Contributing

### Adding New Features

1. Read relevant techwiki documentation
2. Create feature branch
3. Implement with tests
4. Update documentation
5. Submit PR with description

### Updating AI Engines

1. Document prompt changes
2. Test with sample data
3. Monitor costs in production
4. Update validation schemas

---

## Support & Resources

### Documentation
- **TechWiki** - Technical implementation (this folder)
- **TrainWiki** - Training knowledge base
- **Docs** - User-facing documentation

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Vercel Documentation](https://vercel.com/docs)

---

## License

Proprietary - All rights reserved

---

## Contact

For questions about this documentation:
- **Project Lead**: [Your Name]
- **Repository**: https://github.com/loschke/tri-train-buddy
- **Issues**: https://github.com/loschke/tri-train-buddy/issues

---

**Last Updated**: 2024-11-14
**Version**: 2.0.0 (In Development)

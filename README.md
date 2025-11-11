# Ironman Training Planner MVP

AI-powered personalized Ironman training plan generator using Claude API. Generate 14-day training cycles tailored to your performance metrics, race goals, and training constraints.

## Features

- **AI-Powered Training Plans**: Generate personalized 14-day training cycles using Claude Sonnet 4.5
- **Performance Tracking**: Track your fitness metrics (FTP, run pace, swim pace, etc.)
- **Progress Visualization**: Monitor weekly training volume and completion rates with charts
- **Session Management**: Mark sessions as complete and add notes
- **Periodized Planning**: Automatically adjusts training phase based on weeks until race
- **Smart Constraints**: Respects your training rules, run tolerance, and schedule constraints

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: PostgreSQL (Neon recommended)
- **ORM**: Prisma
- **Authentication**: BetterAuth (Email/Password)
- **AI**: Vercel AI SDK + Anthropic Claude API
- **UI**: Shadcn/ui + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Dates**: date-fns

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon, Supabase, or local)
- Anthropic API key

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd tri-train-buddy
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# BetterAuth
BETTER_AUTH_SECRET="your-secret-key-generate-random-string"
BETTER_AUTH_URL="http://localhost:3000"

# Anthropic AI
ANTHROPIC_API_KEY="sk-ant-..."
```

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### 4. Create Your First User

Since this is a single-user MVP, you'll need to create your user account directly in the database or through a signup endpoint.

**Option 1: Use Prisma Studio** (easiest)
```bash
npx prisma studio
```
Then manually create a user in the `User` table.

**Option 2: Create a temporary signup endpoint** (recommended)

Add this to `src/app/api/signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    const result = await auth.api.signUpEmail({
      body: { email, password, name },
      headers: await headers()
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
```

Then use cURL or Postman:
```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your-password","name":"Your Name"}'
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Usage Flow

### First Time Setup

1. **Login** (`/login`) - Sign in with your email and password
2. **Onboarding** (`/onboarding`) - Complete your athlete profile and initial metrics
   - Race date and goal time
   - Training rules (weekly session limits)
   - Performance metrics (FTP, run pace, swim pace, etc.)

### Regular Usage

1. **Dashboard** (`/dashboard`) - View your next 7 days of training
2. **Generate Plan** (`/plan/new`) - Create a new 14-day training cycle
   - Add feedback from previous cycle
   - Specify constraints for the next 2 weeks
3. **Complete Sessions** - Mark workouts as done, add notes
4. **Update Metrics** (`/metrics`) - Record new performance data
5. **Track Progress** (`/progress`) - View weekly volume charts

### Generating a Training Plan

The AI coach considers:

- **Current Training Phase**: Base, Build, Peak, or Taper (based on weeks until race)
- **Performance Metrics**: Your current fitness levels
- **Training Rules**: Rest days, weekly session limits
- **Run Tolerance**: Weekly kilometer limit to prevent overtraining
- **Feedback**: Issues or successes from previous cycles
- **Constraints**: Travel, schedule conflicts, etc.

Plans include:
- 14 days (2 weeks) of training
- Specific workouts with zones, durations, and descriptions
- At least one brick workout (bike→run)
- 80% Zone 1-2 (base endurance)
- Progressive but manageable load

## Project Structure

```
tri-train-buddy/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/         # Login page
│   │   ├── (protected)/       # Auth-protected routes
│   │   │   ├── layout.tsx     # Protected layout with nav
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── onboarding/    # Initial setup
│   │   │   ├── plan/          # Training cycle views
│   │   │   ├── metrics/       # Performance tracking
│   │   │   ├── progress/      # Charts and stats
│   │   │   └── settings/      # Account settings
│   │   └── api/
│   │       ├── auth/          # BetterAuth endpoints
│   │       ├── profile/       # Athlete profile CRUD
│   │       ├── metrics/       # Metrics CRUD
│   │       ├── plan/          # Plan generation
│   │       ├── session/       # Session updates
│   │       └── progress/      # Stats calculation
│   ├── components/
│   │   └── ui/                # Shadcn components
│   ├── lib/
│   │   ├── auth.ts            # BetterAuth server config
│   │   ├── auth-client.ts     # BetterAuth client hooks
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── ai.ts              # Claude API integration
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── index.ts           # TypeScript types
├── .env.local                 # Environment variables
└── package.json
```

## Database Schema

Key models:

- **User**: Authentication and user data
- **AthleteProfile**: Race info and training rules
- **PerformanceMetric**: Historical fitness data
- **TrainingCycle**: 14-day training periods
- **TrainingSession**: Individual workouts

See `prisma/schema.prisma` for full schema.

## API Endpoints

### Authentication
- `POST /api/auth/sign-in/email` - Sign in
- `POST /api/auth/sign-out` - Sign out

### Profile & Metrics
- `GET/POST /api/profile` - Athlete profile
- `GET/POST /api/metrics` - Performance metrics
- `GET /api/metrics/latest` - Latest metrics

### Training Plans
- `POST /api/plan/generate` - Generate 14-day plan
- `PATCH /api/session/[id]` - Update session
- `GET /api/progress` - Progress stats

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `BETTER_AUTH_SECRET` | Random secret for auth | Yes |
| `BETTER_AUTH_URL` | Base URL (e.g., http://localhost:3000) | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Yes |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Database Options:**
- [Neon](https://neon.tech) - Serverless Postgres
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Railway](https://railway.app) - Infrastructure platform

### Post-Deployment

1. Run migrations: `npx prisma migrate deploy`
2. Create your user account
3. Complete onboarding

## Development

### Run Prisma Studio
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma migrate reset
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Type Checking
```bash
npm run build
```

## Customization

### Modify Training Plan Prompt

Edit `src/lib/ai.ts` to customize the AI coach's instructions.

### Change Training Rules

Update the athlete profile form in `src/app/(protected)/onboarding/page.tsx`.

### Add New Metrics

1. Update Prisma schema
2. Run migration
3. Update metrics form

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` format
- Check database is accessible
- Try `npx prisma db push` to sync schema

### Auth Not Working

- Ensure `BETTER_AUTH_SECRET` is set
- Check `BETTER_AUTH_URL` matches your domain
- Clear cookies and try again

### AI Generation Fails

- Verify `ANTHROPIC_API_KEY` is valid
- Check API quota/limits
- Review error logs in console

## Roadmap

**Phase 1 (MVP)** ✅
- Basic authentication
- Onboarding flow
- AI plan generation
- Session tracking
- Progress charts

**Phase 2 (Future)**
- Multi-user support
- Calendar sync (Google Calendar)
- Garmin/Strava integration
- Mobile-responsive improvements
- Email reminders
- Workout library

**Phase 3 (Advanced)**
- Workout builder
- Nutrition planning
- Race day strategy
- Community features
- Mobile app (React Native)

## License

MIT

## Contributing

This is a personal MVP project. Feel free to fork and adapt for your own use!

## Support

For issues or questions:
1. Check existing issues on GitHub
2. Review the troubleshooting section
3. Create a new issue with details

---

Built with ❤️ for endurance athletes

# Ironman Training Planner - UI Flow Guide

## 📱 Kompletter User Journey

```
┌─────────────────┐
│  1. LOGIN       │
│  /login         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. ONBOARDING  │  ◄─── Nur beim ersten Login
│  /onboarding    │
├─────────────────┤
│ Step 1:         │
│ - Renndatum     │
│ - Zielzeit      │
│ - Regeln        │
│                 │
│ Step 2:         │
│ - Run Pace      │
│ - FTP           │
│ - Swim Pace     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  3. DASHBOARD                                           │
│  /dashboard                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Stats: This Week | Active Cycle | Next Action   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Next 7 Days                                      │  │
│  ├──────────────────────────────────────────────────┤  │
│  │                                                  │  │
│  │  📅 Tuesday, Nov 12                             │  │
│  │  🏃 RUN | 60 min | Z2                           │  │
│  │  Easy run at conversational pace                │  │
│  │  [Mark Complete]                                │  │
│  │                                                  │  │
│  │  📅 Wednesday, Nov 13                           │  │
│  │  🚴 BIKE | 90 min | Z2                          │  │
│  │  Endurance ride at 65% FTP                     │  │
│  │  [Mark Complete]                                │  │
│  │                                                  │  │
│  │  ... (bis zu 7 Sessions)                       │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Wenn KEIN aktiver Cycle:                              │
│  [Generate New Plan] Button erscheint!                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         │ User klickt "Generate New Plan"
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  4. PLAN GENERATION                                     │
│  /plan/new                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Start Date: [2025-11-11]                              │
│                                                         │
│  Feedback from Last Cycle (optional):                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Letzte Woche war hart, brauche mehr Erholung   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Constraints (optional):                               │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Geschäftsreise 15-17 Nov, nur indoor möglich   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Generate 14-Day Plan] ◄── Claude API wird gerufen   │
│                                                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ API erstellt:
                  │ - 1 TrainingCycle
                  │ - 14 TrainingSessions
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  5. CYCLE DETAILS                                       │
│  /plan/[cycleId]                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Training Cycle                                        │
│  Nov 11 - Nov 24, 2025                                │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Plan Rationale                                   │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ This 14-day plan focuses on building aerobic    │  │
│  │ base with 80% Z1-Z2 training. Includes one      │  │
│  │ brick workout and respects your run tolerance.  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Week 1 (Nov 11 - Nov 17)                        │  │
│  ├──────────────────────────────────────────────────┤  │
│  │                                                  │  │
│  │  📅 Monday, Nov 11                              │  │
│  │  😴 REST | 0 min                                │  │
│  │  Complete rest and recovery                     │  │
│  │  [Mark Complete]                                │  │
│  │                                                  │  │
│  │  📅 Tuesday, Nov 12                             │  │
│  │  🏃 RUN | 60 min | Z2                           │  │
│  │  10min warmup, 40min at 6:20/km, 10min cool    │  │
│  │  [Mark Complete]                                │  │
│  │                                                  │  │
│  │  📅 Wednesday, Nov 13                           │  │
│  │  🚴 BIKE | 90 min | Z2                          │  │
│  │  15min warmup, 60min at 130W (65% FTP), cool   │  │
│  │  [Mark Complete]                                │  │
│  │                                                  │  │
│  │  ... (7 Sessions total)                        │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Week 2 (Nov 18 - Nov 24)                        │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ ... (7 Sessions)                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Wo werden Sessions angezeigt?

### **Szenario: Du hast einen Cycle vom 11. Nov - 24. Nov**

#### **Dashboard (`/dashboard`)**
```
Zeigt: NUR Sessions zwischen HEUTE und HEUTE + 7 Tage
```

**Beispiel heute = 11. November:**
```
✅ Sichtbar: Sessions vom 11. - 18. November (7 Tage)
❌ NICHT sichtbar: Sessions vom 19. - 24. November
```

**Wenn heute = 15. November:**
```
✅ Sichtbar: Sessions vom 15. - 22. November
❌ NICHT sichtbar: Sessions vom 11. - 14. November (Vergangenheit)
❌ NICHT sichtbar: Sessions vom 23. - 24. November (außerhalb 7 Tage)
```

#### **Cycle Details (`/plan/[cycleId]`)**
```
Zeigt: ALLE 14 Sessions
```

**Immer sichtbar:**
```
✅ Week 1: Sessions 1-7 (11. - 17. Nov)
✅ Week 2: Sessions 8-14 (18. - 24. Nov)
```

---

## 🔍 Typisches Problem & Lösung

### **Problem: "Ich sehe keine Sessions!"**

**Diagnose:**

1. **Gehe zu Neon DB:**
```sql
SELECT status, "startDate", "endDate"
FROM "TrainingCycle"
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Mögliche Ausgaben:**

#### **Fall A: Cycle ist PLANNED**
```
status  | startDate  | endDate
--------|------------|----------
PLANNED | 2025-11-11 | 2025-11-24
```

**Problem:** Dashboard zeigt nur ACTIVE Cycles!

**Fix:**
```sql
UPDATE "TrainingCycle"
SET status = 'ACTIVE'
WHERE status = 'PLANNED';
```

#### **Fall B: Startdatum ist in der Vergangenheit**
```
status | startDate  | endDate
-------|------------|----------
ACTIVE | 2025-11-01 | 2025-11-14
```

**Problem:** Heute ist 11. November, aber Cycle endet am 14.!
Sessions vom 1.-10. sind in Vergangenheit, nur 11-14 würden erscheinen.

**Fix:** Neuen Cycle mit korrektem Datum generieren

#### **Fall C: Startdatum ist in der Zukunft**
```
status | startDate  | endDate
-------|------------|----------
ACTIVE | 2025-11-20 | 2025-12-03
```

**Problem:** Heute ist 11. November, aber Cycle startet erst am 20.!

**Fix:** Entweder warten oder neuen Cycle mit früherem Datum generieren

---

## 📊 Code-Flow beim Plan Generieren

```typescript
// User klickt "Generate 14-Day Plan"
// → src/app/(protected)/plan/new/page.tsx:39

1. POST /api/plan/generate
   ├─ body: { startDate, feedback, constraints }
   │
2. API Route Handler
   ├─ src/app/api/plan/generate/route.ts:19
   │
3. Hole User Daten
   ├─ AthleteProfile (Renndatum, Regeln)
   ├─ PerformanceMetric (FTP, Pace, etc.)
   │
4. Rufe Claude API
   ├─ src/lib/ai.ts:41 - generateTrainingPlan()
   ├─ Prompt mit allen Daten
   ├─ Claude generiert 14 Sessions
   │
5. Speichere in DB
   ├─ TrainingCycle erstellen
   ├─ 14 TrainingSessions erstellen
   ├─ Status auf ACTIVE setzen ◄─── WICHTIG!
   │
6. Return cycle.id
   │
7. Frontend Redirect
   └─ router.push(`/plan/${cycle.id}`)
```

---

## 🗂️ Datenbank-Struktur

```
TrainingCycle
├─ id: "cycle-abc123"
├─ userId: "user-xyz"
├─ startDate: 2025-11-11
├─ endDate: 2025-11-24
├─ status: "ACTIVE"  ◄─── Muss ACTIVE sein!
├─ rationale: "This plan focuses on..."
└─ generatedPlan: { week1: [...], week2: [...] }

TrainingSession (14 Stück)
├─ id: "session-1"
├─ cycleId: "cycle-abc123"  ◄─── Verknüpfung!
├─ date: 2025-11-11
├─ discipline: "REST"
├─ durationMinutes: 0
├─ intensityZone: null
├─ description: "Complete rest day"
├─ completed: false  ◄─── Ändert sich zu true
└─ actualNotes: null

... (13 weitere Sessions)
```

---

## ✅ Schnell-Check: Ist alles korrekt?

**SQL Query:**
```sql
SELECT
  tc.status,
  tc."startDate",
  tc."endDate",
  COUNT(ts.id) as sessions
FROM "TrainingCycle" tc
LEFT JOIN "TrainingSession" ts ON tc.id = ts."cycleId"
WHERE tc.status = 'ACTIVE'
GROUP BY tc.id;
```

**Erwartete Ausgabe:**
```
status | startDate  | endDate    | sessions
-------|------------|------------|---------
ACTIVE | 2025-11-11 | 2025-11-24 | 14
```

**Wenn anders:**
- `sessions < 14` → Sessions fehlen!
- `status != ACTIVE` → Cycle ist nicht aktiv!
- Leer → Kein aktiver Cycle vorhanden!

---

## 🎬 Empfohlener Test-Flow

1. **Lösche alte Test-Daten:**
```sql
DELETE FROM "TrainingSession";
DELETE FROM "TrainingCycle";
```

2. **Gehe zu `/plan/new`**

3. **Generiere neuen Plan:**
   - Start Date: Morgen
   - Feedback: leer
   - Constraints: leer

4. **Du solltest sehen:**
   - Redirect zu `/plan/[id]`
   - 14 Sessions in 2 Wochen
   - "Week 1" und "Week 2" Cards

5. **Gehe zu `/dashboard`**

6. **Du solltest sehen:**
   - "Next 7 Days" mit Sessions
   - Wenn startDate = morgen, erscheint morgen die erste Session

---

## 🆘 Support-Checkliste

Wenn Sessions nicht erscheinen:

- [ ] Cycle existiert in DB?
- [ ] Cycle.status = 'ACTIVE'?
- [ ] 14 TrainingSessions vorhanden?
- [ ] Sessions haben richtige cycleId?
- [ ] Datum-Range passt (HEUTE bis HEUTE + 7)?
- [ ] Browser Console Errors?
- [ ] 401/403 Auth-Errors?
- [ ] User ist eingeloggt?

**Meistens ist es:** Status ist PLANNED statt ACTIVE! 🎯

# Debug-Guide: Warum sehe ich meine Sessions nicht?

## Checklist

### 1. Wurde der Cycle erfolgreich erstellt?

**In Neon DB prüfen:**
```sql
-- TrainingCycle checken
SELECT * FROM "TrainingCycle" ORDER BY "createdAt" DESC LIMIT 1;

-- Sessions checken
SELECT COUNT(*) FROM "TrainingSession";
SELECT * FROM "TrainingSession" ORDER BY date LIMIT 5;
```

**Was du sehen solltest:**
- 1 TrainingCycle mit `status = 'ACTIVE'`
- 14 TrainingSessions mit `cycleId` = die Cycle-ID

---

### 2. Ist der Cycle Status = 'ACTIVE'?

**Problem:** Dashboard zeigt nur AKTIVE Cycles!

**Prüfen in DB:**
```sql
SELECT id, status, "startDate", "endDate"
FROM "TrainingCycle"
WHERE status = 'ACTIVE';
```

**Fix in DB (falls PLANNED):**
```sql
UPDATE "TrainingCycle"
SET status = 'ACTIVE'
WHERE id = 'deine-cycle-id';
```

---

### 3. Sind die Session-Daten im richtigen Zeitraum?

**Dashboard zeigt nur:** Sessions zwischen HEUTE und HEUTE + 7 Tage

**Prüfen:**
```sql
-- Heute als Referenz
SELECT CURRENT_DATE;

-- Sessions in den nächsten 7 Tagen
SELECT date, discipline, "durationMinutes"
FROM "TrainingSession"
WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY date;
```

**Wenn leer:** Sessions sind in der Vergangenheit oder zu weit in der Zukunft!

**Fix:** Neuen Cycle mit korrektem Startdatum generieren

---

### 4. Gehört der Cycle zum richtigen User?

**Prüfen:**
```sql
-- Deine User ID
SELECT id, email, name FROM "user";

-- Cycles für deinen User
SELECT * FROM "TrainingCycle" WHERE "userId" = 'deine-user-id';
```

**Wenn leer:** Cycle gehört zu anderem User!

---

### 5. Frontend-Debugging

**Browser Console öffnen (F12) und prüfen:**

1. **Auf `/dashboard`:**
   - Sind API-Errors in der Console?
   - Gibt es 401 (Unauthorized) oder 500 Errors?

2. **React DevTools:**
   - Ist `session` gesetzt?
   - Sind `upcomingSessions` leer?

3. **Network Tab:**
   - Wird `/api/profile` aufgerufen?
   - Was ist die Response?

---

### 6. Typische Fehlerquellen

#### **A) Cycle wurde nicht korrekt gespeichert**

**Symptom:** Kein Redirect nach `/plan/[id]` nach Generation

**Prüfen in Code:**
```
src/app/api/plan/generate/route.ts:71-86
```

**Fix:** API-Logs checken, evtl. Claude API Error

---

#### **B) Sessions haben falsches Format**

**Symptom:** Sessions in DB, aber Frontend zeigt nichts

**Prüfen:**
```sql
SELECT discipline, date, "cycleId", completed
FROM "TrainingSession"
LIMIT 1;
```

**Erwartetes Format:**
- `discipline`: "RUN" | "BIKE" | "SWIM" | "GYM" | "REST"
- `date`: TIMESTAMP (z.B. "2025-11-12T00:00:00.000Z")
- `cycleId`: String (muss existieren in TrainingCycle)

---

#### **C) Datum-Logik-Fehler**

**Problem:** `startOfDay()` vs Zeitzone-Probleme

**Code:**
```typescript
// src/app/(protected)/dashboard/page.tsx:37-38
const today = startOfDay(new Date())
const nextWeek = addDays(today, 7)
```

**Wenn Sessions nicht erscheinen:**
- Session.date ist evtl. UTC
- `today` ist in deiner lokalen Zeitzone
- Vergleich schlägt fehl!

**Quick Fix in DB:**
```sql
-- Sessions auf "heute" setzen
UPDATE "TrainingSession"
SET date = CURRENT_DATE + (ROW_NUMBER() OVER (ORDER BY date))
WHERE "cycleId" = 'deine-cycle-id';
```

---

### 7. Manueller Test

**Erstelle einen Test-Cycle manuell in der DB:**

```sql
-- 1. Cycle erstellen
INSERT INTO "TrainingCycle" (
  id, "userId", "startDate", "endDate", status
) VALUES (
  'test-cycle-123',
  'deine-user-id',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '13 days',
  'ACTIVE'
);

-- 2. Test-Session erstellen
INSERT INTO "TrainingSession" (
  id, "cycleId", date, discipline, "durationMinutes",
  intensityZone, description
) VALUES (
  'test-session-1',
  'test-cycle-123',
  CURRENT_DATE + INTERVAL '1 day',
  'RUN',
  60,
  'Z2',
  'Easy 60min run at conversational pace'
);
```

**Dann Dashboard refreshen!**

---

## Sofort-Check Kommandos

```bash
# Im Terminal
npm run dev

# Browser öffnen
open http://localhost:3000/dashboard
```

**Erwartetes Verhalten:**
1. Dashboard lädt
2. "Next 7 Days" Card erscheint
3. Sessions sind sichtbar mit Datum, Disziplin, Dauer
4. "Mark Complete" Button ist da

**Falls leer:**
→ Gehe durch Checklist oben!

---

## Schnelle SQL-Queries zum Debuggen

```sql
-- Alles auf einen Blick
SELECT
  u.email,
  tc.status as cycle_status,
  tc."startDate",
  tc."endDate",
  COUNT(ts.id) as session_count
FROM "user" u
LEFT JOIN "TrainingCycle" tc ON u.id = tc."userId"
LEFT JOIN "TrainingSession" ts ON tc.id = ts."cycleId"
GROUP BY u.id, tc.id;
```

**Erwartete Output:**
```
email              | cycle_status | startDate  | endDate    | session_count
-------------------+--------------+------------+------------+--------------
rico@example.com   | ACTIVE       | 2025-11-11 | 2025-11-24 | 14
```

Wenn `session_count = 0` → Sessions wurden nicht erstellt!
Wenn `cycle_status = PLANNED` → Cycle ist nicht aktiv!

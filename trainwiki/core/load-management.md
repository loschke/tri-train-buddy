# Load Management (Belastungssteuerung)

## Definition

Load management is the systematic quantification and control of training stress to optimize adaptations while minimizing injury and overtraining risk. It balances **acute load** (recent training) with **chronic load** (long-term fitness) to determine readiness and injury risk.

## Core Concepts

### 1. Training Load vs. Training Volume

**Volume**: Simple measure of quantity
- Duration (hours, minutes)
- Distance (km, miles)
- **Ignores intensity**

**Load**: Combined measure of volume AND intensity
- Accounts for workout difficulty
- Better predictor of fatigue and adaptation
- Examples: Training Stress Score (TSS), TRIMP, sRPE

**Example**:
```
Workout A: 60min easy run (Z2)
Workout B: 60min with 10×400m intervals (Z5)

Same volume (60min)
Different load (B is much higher stress)
```

---

## Training Load Metrics

### 1. Training Stress Score (TSS) - Cycling

**Formula** (for cycling with power meter):
```
TSS = (seconds × NP × IF) / (FTP × 3600) × 100

Where:
NP  = Normalized Power (accounts for variability)
IF  = Intensity Factor (NP / FTP)
FTP = Functional Threshold Power
```

**Interpretation**:
```
<150 TSS:   Low stress, easy recovery
150-300:    Moderate stress, recovery in 1-2 days
300-450:    High stress, recovery in 2-3 days
>450:       Very high stress, multiple days recovery
```

**Example**:
```
2-hour ride at 200W (FTP = 250W)
NP = 200W
IF = 200/250 = 0.80

TSS = (7200 × 200 × 0.80) / (250 × 3600) × 100
    = 128 TSS

Recovery: 1 day
```

### 2. Running TSS (rTSS)

**Estimation** (without power meter):
```
rTSS = Duration (hours) × 100 × Intensity Factor²

Intensity Factor = Pace / Threshold Pace

Example:
60min run at 6:00/km (threshold = 5:00/km)
IF = 5:00 / 6:00 = 0.83

rTSS = 1 hour × 100 × 0.83²
     = 69 rTSS
```

**By Perceived Effort** (simpler):
```
Zone 1 (recovery):     20-40 TSS/hour
Zone 2 (endurance):    50-70 TSS/hour
Zone 3 (tempo):        70-90 TSS/hour
Zone 4 (threshold):    90-110 TSS/hour
Zone 5 (VO2max):       110-130+ TSS/hour
```

### 3. TRIMP (Training Impulse)

**Formula** (heart rate-based):
```
TRIMP = Duration (min) × Average HR × Weighting Factor

Weighting Factor (Banister):
Men:   e^(1.92 × %HRR)
Women: e^(1.67 × %HRR)

Where %HRR = Heart Rate Reserve
           = (AvgHR - RestingHR) / (MaxHR - RestingHR)
```

**Example**:
```
Male athlete:
Resting HR: 50 bpm
Max HR: 190 bpm
Workout: 60min at average 160 bpm

%HRR = (160 - 50) / (190 - 50) = 0.786

Weighting = e^(1.92 × 0.786) = 4.61

TRIMP = 60 × 160 × 4.61 = 44,256
(scale by 0.01 → 443 TRIMP)
```

### 4. Session RPE (sRPE) - Simplest Method

**Formula**:
```
sRPE Load = Duration (minutes) × RPE (1-10 scale)
```

**RPE Scale**:
```
1-2: Very easy (recovery)
3-4: Easy (aerobic)
5-6: Moderate (tempo)
7-8: Hard (threshold)
9-10: Maximum (VO2max/sprint)
```

**Example**:
```
Workout: 90min ride at moderate effort (RPE 5)
sRPE Load = 90 × 5 = 450

Workout: 45min with hard intervals (RPE 8)
sRPE Load = 45 × 8 = 360
```

**Advantages**:
- No devices needed
- Works for all sports (even swimming, strength)
- Simple, quick
- Scientifically validated

**Best Practice**:
- Record RPE 10-30 minutes AFTER workout (not during)
- Use whole session average (not just intervals)

---

## Chronic Training Load (CTL)

### Definition

**CTL** = Fitness / Long-term training load
- Exponentially weighted average of daily TSS
- 42-day rolling average (6 weeks)
- Represents aerobic fitness level

### Calculation

```
CTL_today = CTL_yesterday + (TSS_today - CTL_yesterday) / 42

Example:
CTL yesterday: 80
TSS today: 100

CTL today = 80 + (100 - 80) / 42
          = 80 + 0.48
          = 80.48
```

### Interpretation

```
CTL <40:     Beginner / Off-season
CTL 40-60:   Recreational athlete
CTL 60-80:   Competitive age-grouper
CTL 80-100:  Advanced / Sub-elite
CTL >100:    Elite / Professional
```

**Sport-Specific CTL**:
```
Marathon Runner:
CTL 60-80:  3:30-4:00 marathon
CTL 80-100: 3:00-3:30 marathon
CTL >100:   Sub-3:00 marathon

Ironman Triathlete:
CTL 60-80:  12:00-13:00 finish
CTL 80-100: 10:30-12:00 finish
CTL >100:   Sub-10:30 finish
```

---

## Acute Training Load (ATL)

### Definition

**ATL** = Fatigue / Recent training load
- 7-day rolling average of TSS
- Represents immediate fatigue

### Calculation

```
ATL_today = ATL_yesterday + (TSS_today - ATL_yesterday) / 7

Example:
ATL yesterday: 70
TSS today: 120

ATL today = 70 + (120 - 70) / 7
          = 70 + 7.14
          = 77.14
```

### Interpretation

High ATL = High immediate fatigue
```
ATL >> CTL: Very fatigued (heavy training block)
ATL ≈ CTL:  Balanced
ATL << CTL: Well-rested (taper, recovery week)
```

---

## Training Stress Balance (TSB)

### Definition

**TSB** = Freshness / Readiness
- Difference between fitness (CTL) and fatigue (ATL)
- Indicates current form/readiness

### Formula

```
TSB = CTL - ATL
```

### Interpretation

```
TSB > +10:   Very fresh, may be losing fitness
TSB 0 to +10: Fresh, good for racing
TSB -10 to 0: Balanced training
TSB -10 to -20: Fatigued, building fitness
TSB < -20:   Very fatigued, risk of overtraining
```

**Race Day Target**: TSB = +5 to +15

**Training Phases**:
```
Base/Build Phase:   TSB = -10 to -25 (accumulating fatigue)
Recovery Week:      TSB = -5 to +5 (recovering)
Taper:             TSB = 0 to +15 (peaking)
Race Day:          TSB = +5 to +15 (optimal form)
```

---

## Load Management Strategies

### 1. Progressive Overload

**Principle**: Gradually increase load to drive adaptation

**Weekly Increase**: 5-10% max
- Conservative: 5% (injury-prone, masters athletes)
- Moderate: 7%
- Aggressive: 10% (young, robust athletes)

**CTL Ramp Rate**: +3-8 CTL points per week
```
Week 1: CTL 60
Week 2: CTL 65 (+5)
Week 3: CTL 70 (+5)
Week 4: CTL 62 (recovery week, -8)
Week 5: CTL 68 (+6, resume building)
```

**Ramp Rate Warnings**:
```
+5-8/week:   Sustainable (good progress)
+8-12/week:  Risky (monitor closely)
>+12/week:   Dangerous (high injury risk)
```

### 2. Acute:Chronic Workload Ratio (ACWR)

**Formula**:
```
ACWR = ATL / CTL
     = (7-day average) / (42-day average)
```

**Interpretation** (Injury Risk):
```
ACWR < 0.8:    Detraining (too little load)
ACWR 0.8-1.3:  Sweet Spot (optimal) ✅
ACWR 1.3-1.5:  Caution (elevated risk) ⚠️
ACWR > 1.5:    Danger Zone (high injury risk) ❌
```

**Example**:
```
CTL (fitness): 80
ATL (fatigue): 95

ACWR = 95 / 80 = 1.19 ✅ (safe zone)
```

**Visual Interpretation**:
```
ACWR 0.8-1.0: ATL < CTL (fresh, ready to race)
ACWR 1.0-1.3: ATL ≈ CTL (productive training)
ACWR 1.3+:    ATL >> CTL (risky spike in load)
```

**Practical Application**:
- Monitor weekly
- If ACWR > 1.3 → reduce next week's load
- Avoid sudden spikes (e.g., doubling volume)

### 3. Periodized Load Distribution

**Base Phase** (Building CTL):
```
Week 1: 100% baseline (e.g., 400 TSS/week)
Week 2: 110% (440 TSS)
Week 3: 120% (480 TSS)
Week 4: 60% recovery (240 TSS) ← Critical!
Week 5: 125% (500 TSS, new baseline)
```

**CTL Trajectory**:
```
Start of Block: CTL 65
After Week 3:   CTL 72 (+7, fatigued)
After Week 4:   CTL 69 (-3, supercompensation)
Resume Week 5:  CTL 73 (higher baseline)
```

**Taper Phase** (Reducing ATL, maintaining CTL):
```
Week -3: 100% (TSB = -15)
Week -2: 70%  (TSB = -5)
Week -1: 50%  (TSB = +5)
Race:    30%  (TSB = +10) ← Optimal!
```

---

## Weekly Load Planning

### Target Weekly TSS by Athlete Level

**Beginner** (CTL 30-50):
```
Weekly TSS: 200-400
Typical: 4-6 hours training
Distribution: 80% Z1-2, 20% Z3+
```

**Intermediate** (CTL 50-70):
```
Weekly TSS: 400-600
Typical: 8-12 hours training
Distribution: 80% Z1-2, 20% Z4-5
```

**Advanced** (CTL 70-90):
```
Weekly TSS: 600-800
Typical: 12-16 hours training
Distribution: 75% Z1-2, 25% Z4-5
```

**Elite** (CTL 90-120+):
```
Weekly TSS: 800-1200+
Typical: 18-25+ hours training
Distribution: 70-75% Z1-2, 25-30% Z4-5
```

### Daily Load Distribution

**Hard/Easy Principle**:
```
Monday:    Rest (0 TSS)
Tuesday:   HARD (150 TSS)
Wednesday: Easy (60 TSS)
Thursday:  Moderate (100 TSS)
Friday:    Easy (50 TSS)
Saturday:  HARD (180 TSS) ← Long session
Sunday:    Moderate (100 TSS)

Weekly Total: 640 TSS
Hard Days: 2 (Tu, Sa)
Easy Days: 3 (We, Fr, Su)
Rest: 1 (Mo)
```

**Load Pattern**:
```
    TSS
    200│     ┌─┐
    150│  ┌─┐│ │
    100│  │ ││ │  ┌─┐  ┌─┐
     50│  │ │└─┘┌─┘ └─┐│ │
      0│─┬┘ │   │     ││ │
       └─┴──┴───┴─────┴┴─┴─
        M  T  W  T  F  S  S
```

---

## Monitoring & Adjustments

### Red Flags (Reduce Load)

**Physiological**:
- Resting HR +5-10 bpm above normal
- HRV down 20%+ from baseline
- Inability to hit target paces/power
- Persistent muscle soreness (>48h)
- Elevated perceived effort (+1-2 RPE for same workout)

**Performance**:
- Declining benchmark results
- Cannot complete prescribed workouts
- Increasing completion time for same sessions

**Psychological**:
- Decreased motivation
- Irritability
- Sleep disturbances
- Loss of appetite

**Load Metrics**:
- ACWR > 1.5 (injury risk)
- TSB < -30 (severe fatigue)
- CTL ramp rate > +12/week (too aggressive)

**Action**: Reduce load 30-50% for 1 week

### Green Lights (Can Increase Load)

**Physiological**:
- Resting HR at baseline
- HRV at or above baseline
- Easy workouts feel easy
- Good recovery between sessions

**Performance**:
- Hitting all workout targets
- Improving benchmark results
- Feeling strong

**Psychological**:
- High motivation
- Good mood
- Quality sleep
- Healthy appetite

**Load Metrics**:
- ACWR 0.8-1.2
- TSB -10 to -20 (productive training)
- CTL ramping at +5-8/week

**Action**: Continue plan or increase 5-10%

---

## Sport-Specific Load Considerations

### Running Load

**High Impact**: Extra attention to volume increases

**Max Weekly Increase**: 10% of distance OR add 1 session
```
Week 1: 50km (5 runs)
Week 2: 55km (5 runs) ✅ 10% increase
OR
Week 2: 50km (6 runs) ✅ Add 1 easy session

NOT:
Week 2: 60km (6 runs) ❌ Both volume AND frequency
```

**Load Spikes to Avoid**:
- Back-to-back long runs
- Hard track session after long run
- Sudden increase in hill volume

**Monitor**:
- Foot strike count (volume metric)
- Impact loading (vertical oscillation)
- Ground contact time

### Cycling Load

**Lower Impact**: Can tolerate higher volume increases

**Max Weekly Increase**: 10-15%
```
Week 1: 200km
Week 2: 220km ✅ (10% increase)
Week 3: 240km ✅ (9% increase)
```

**Load Spikes to Avoid**:
- Sudden increase in climbing volume
- Back-to-back hard interval days
- Very long ride (>5h) without build-up

**Monitor**:
- Power (TSS most accurate for cycling)
- Pedal smoothness
- Cadence consistency

### Swimming Load

**Very Low Impact**: Can tolerate high volume

**Max Weekly Increase**: 15-20%
```
Week 1: 10km
Week 2: 11.5km ✅ (15% increase)
```

**Load Spikes to Avoid**:
- Excessive use of paddles (shoulder stress)
- All-hard swimming (no easy warm-up/cool-down)
- Sudden increase in pull volume

**Monitor**:
- Stroke count (efficiency)
- Shoulder fatigue
- Technique breakdown

### Triathlon Combined Load

**Challenge**: Managing 3 sports simultaneously

**Strategy**:
- Track combined TSS (all 3 sports)
- Avoid hard sessions in multiple sports on same day
- Prioritize limiters (weakest sport gets most load)

**Example Weekly TSS Distribution**:
```
Total: 600 TSS
Swim: 100 TSS (17%)
Bike: 300 TSS (50%)
Run:  200 TSS (33%)

Note: Bike gets most (lowest impact, highest volume potential)
```

---

## Load Management for Different Phases

### Base Phase

**Goal**: Build CTL progressively

**Load Pattern**:
- High volume, low intensity
- Gradual CTL increase (+5-7/week)
- ACWR 0.9-1.2
- TSB -10 to -20

**Example**:
```
Week 1: 500 TSS (CTL 65)
Week 2: 550 TSS (CTL 70)
Week 3: 600 TSS (CTL 75)
Week 4: 350 TSS (CTL 72, recovery week)
```

### Build Phase

**Goal**: Increase both volume and intensity

**Load Pattern**:
- Peak weekly TSS (highest of year)
- CTL ramp +6-8/week (aggressive)
- ACWR 1.0-1.3
- TSB -15 to -25

**Example**:
```
Week 1: 650 TSS (CTL 78)
Week 2: 700 TSS (CTL 84)
Week 3: 750 TSS (CTL 90)
Week 4: 450 TSS (CTL 85, recovery)
```

### Peak Phase

**Goal**: Race-specific intensity, moderate volume

**Load Pattern**:
- Volume slightly reduced
- Intensity maintained/increased
- CTL maintained (not building)
- ACWR 0.9-1.1
- TSB -10 to -20

**Example**:
```
Weeks: 600-650 TSS (steady)
CTL: 85-90 (plateau)
Focus: Quality over quantity
```

### Taper Phase

**Goal**: Reduce fatigue, maintain fitness

**Load Pattern**:
- Volume reduced 30-50%
- Frequency maintained
- Intensity brief, sharp
- ATL drops rapidly
- CTL drops slightly (acceptable)
- TSB rises to +5 to +15

**Example (3-Week Taper)**:
```
Week -3: 650 TSS (TSB -15, CTL 90)
Week -2: 450 TSS (TSB -5, CTL 88)
Week -1: 300 TSS (TSB +5, CTL 86)
Race:    100 TSS (TSB +10, CTL 85) ✅
```

**Taper TSS Reduction**:
```
Week -3: 100% (baseline)
Week -2: 70% (reduce volume)
Week -1: 50% (further reduce)
Race week: 30% (minimal, sharpeners only)
```

---

## Technology & Tools

### Software

**TrainingPeaks** ⭐⭐⭐⭐⭐
- CTL, ATL, TSB automatic calculation
- TSS scoring for all sports
- PMC (Performance Management Chart)
- Workout library

**Today's Plan** ⭐⭐⭐⭐
- Similar to TrainingPeaks
- Triathlon-specific focus

**Garmin Connect** ⭐⭐⭐
- Training Load (7-day load focus)
- Training Status
- Free with Garmin device

**Strava** ⭐⭐
- "Fitness & Freshness" (premium)
- Less sophisticated than TrainingPeaks

### Devices

**Power Meters** (Cycling):
- Direct measurement (most accurate)
- Real-time TSS tracking
- Brands: Garmin, Wahoo, Stages, PowerTap

**Heart Rate Monitors**:
- Chest strap (most accurate): Garmin HRM-Pro, Polar H10
- Optical (wrist): Garmin, Apple Watch, Whoop

**GPS Watches**:
- Garmin Forerunner/Fenix series
- Polar Vantage
- Coros Apex/Pace

**Recovery Trackers**:
- Whoop (HRV, strain, recovery)
- Oura Ring (sleep, HRV)
- Garmin watches (Body Battery, HRV)

---

## Practical Load Management Checklist

### Daily
- [ ] Record workout (duration, intensity, RPE)
- [ ] Calculate/log TSS
- [ ] Check resting HR (morning)
- [ ] Note sleep quality

### Weekly
- [ ] Sum weekly TSS
- [ ] Check ACWR (should be 0.8-1.3)
- [ ] Review TSB (appropriate for phase?)
- [ ] Plan next week's load
- [ ] Assess subjective readiness

### Every 3-4 Weeks
- [ ] Schedule recovery week
- [ ] Reduce volume 40-60%
- [ ] Review CTL trend (building appropriately?)
- [ ] Assess injury/illness patterns
- [ ] Adjust plan if needed

### Monthly
- [ ] Benchmark workout (FTP test, threshold run)
- [ ] Review long-term CTL trajectory
- [ ] Check if CTL target on track
- [ ] Body composition check
- [ ] Strength benchmarks

---

## Common Load Management Mistakes

### ❌ Mistake 1: Ignoring Recovery Weeks
**Problem**: Continuous building without rest
**Result**: ACWR spikes, injury risk
**Solution**: Mandatory recovery week every 3-4 weeks

### ❌ Mistake 2: Chasing Volume
**Problem**: Increasing hours without considering intensity
**Result**: Junk miles, no adaptation
**Solution**: Track TSS, not just hours

### ❌ Mistake 3: Random Training
**Problem**: No structure, inconsistent load
**Result**: No fitness progression
**Solution**: Periodized plan with progressive overload

### ❌ Mistake 4: Sudden Load Spikes
**Problem**: ACWR > 1.5 (e.g., doubling volume)
**Result**: Injury
**Solution**: Max 10% increase per week

### ❌ Mistake 5: Insufficient Taper
**Problem**: Arriving at race with ATL >> CTL
**Result**: Poor performance
**Solution**: 2-4 week taper, TSB = +5 to +15

### ❌ Mistake 6: Training Through Red Flags
**Problem**: Ignoring elevated RHR, low HRV, poor performance
**Result**: Overtraining syndrome
**Solution**: Rest/reduce when metrics indicate

---

## Key Takeaways for AI Training Plans

✅ **Calculate weekly TSS** (use sRPE if no devices)
✅ **Progressive overload** (max +10% TSS per week)
✅ **Monitor ACWR** (keep 0.8-1.3)
✅ **Recovery weeks** (every 3-4 weeks, 40-60% reduction)
✅ **CTL ramp rate** (+5-8 per week sustainable)
✅ **Taper properly** (reduce ATL, TSB = +5 to +15 race day)
✅ **Hard/easy distribution** (no back-to-back hard days)
✅ **Sport-specific load** (running most conservative, swim least)
✅ **Adjust to feedback** (if athlete reports fatigue, reduce load)
✅ **Phase-appropriate TSB** (build: -20, taper: +10)

---

## References

**Books**:
- *Training and Racing with a Power Meter* by Hunter Allen & Andrew Coggan
- *The Triathlete's Training Bible* by Joe Friel (CTL/ATL/TSB concepts)

**Research**:
- Gabbett, T. J. (2016). "The training-injury prevention paradox: ACWR"
- Coggan, A. R. (2003). "Training and racing using a power meter"
- Foster, C. et al. (2001). "A new approach to monitoring exercise training" (sRPE)

**Tools**:
- TrainingPeaks.com (TSS calculator, PMC)
- Garmin Connect (Training Load)
- Strava (Fitness & Freshness)

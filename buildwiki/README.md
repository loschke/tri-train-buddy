# BuildWiki - Tri-Train-Buddy Implementation Guide

## Overview

Dieses Wiki ist der **praktische Umsetzungsplan** für Tri-Train-Buddy Version 2.0. Es basiert auf der technischen Dokumentation im `techwiki/` und dem Trainingswissen im `trainwiki/`.

**Zweck:**
- Strukturierte, phasenweise Implementierung
- Klare Meilensteine und Erfolgskriterien
- Minimierung von Risiken durch schrittweisen Aufbau
- Testing in jeder Phase
- Praktische Checklisten für die Umsetzung

---

## Strategie: Incremental Build with Validation

Wir bauen die Plattform in **5 Phasen**, wobei jede Phase:
1. ✅ **Vollständig getestet** wird, bevor die nächste startet
2. ✅ **Funktionsfähig** ist (keine "halb-fertigen" Features)
3. ✅ **Deploybar** ist (jede Phase kann live gehen)
4. ✅ **Rollback-fähig** ist (bei Problemen zurück zur vorherigen Phase)

---

## Phasen-Übersicht

### **Phase 1: Foundation** (Woche 1-2)
🎯 **Ziel:** Funktionierende Basis-Infrastruktur

**Deliverables:**
- Database mit Prisma Schema
- Authentication (BetterAuth)
- Basic API Structure
- Einfaches Dashboard (statisch)

**Erfolgskriterium:** User kann sich registrieren, anmelden, und sieht ein Dashboard

📄 **Dokument:** [phase-1-foundation.md](./phase-1-foundation.md)

---

### **Phase 2: AI Core** (Woche 3-4)
🎯 **Ziel:** AI-Engines funktionieren und generieren Trainingspläne

**Deliverables:**
- Plan Generation Engine
- Constraint Parser (Natural Language)
- Basic Feedback Collection
- AI-powered Insights

**Erfolgskriterium:** User bekommt einen validierten 2-Wochen-Trainingsplan

📄 **Dokument:** [phase-2-ai-core.md](./phase-2-ai-core.md)

---

### **Phase 3: User Features** (Woche 5-6)
🎯 **Ziel:** Komplette User Journey funktioniert

**Deliverables:**
- Conversational Onboarding
- Workout Tracking
- Feedback Analysis Engine
- Educational Content Engine
- Dashboard mit AI Insights

**Erfolgskriterium:** User kann kompletten Workflow durchlaufen (Onboarding → Plan → Training → Feedback)

📄 **Dokument:** [phase-3-user-features.md](./phase-3-user-features.md)

---

### **Phase 4: Gamification & Motivation** (Woche 7)
🎯 **Ziel:** Engagement- und Motivations-Features

**Deliverables:**
- Achievement System
- Streak Tracking
- Progress Visualization
- Knowledge Graph (Learning)

**Erfolgskriterium:** User sieht Achievements, Streaks, und Lernfortschritt

📄 **Dokument:** [phase-4-gamification.md](./phase-4-gamification.md)

---

### **Phase 5: Polish & Production** (Woche 8-9)
🎯 **Ziel:** Production-ready Platform

**Deliverables:**
- Performance Optimization
- Error Handling & Monitoring
- Mobile Optimization
- Security Hardening
- Documentation finalisieren

**Erfolgskriterium:** Platform läuft stabil mit <2s Ladezeiten, fehlerfreie Logs

📄 **Dokument:** [phase-5-polish.md](./phase-5-polish.md)

---

## Ergänzende Guides

### **Testing Strategy**
Wie testen wir jede Phase? Unit-, Integration-, E2E-Tests

📄 **Dokument:** [testing-strategy.md](./testing-strategy.md)

### **Deployment Guide**
Step-by-step Anleitung für Deployment nach jeder Phase

📄 **Dokument:** [deployment-guide.md](./deployment-guide.md)

### **Troubleshooting**
Häufige Probleme und Lösungen während der Implementierung

📄 **Dokument:** [troubleshooting.md](./troubleshooting.md)

---

## Zeitplan (Optimistisch)

```
Woche 1-2   ████████████ Phase 1: Foundation
Woche 3-4   ████████████ Phase 2: AI Core
Woche 5-6   ████████████ Phase 3: User Features
Woche 7     ██████       Phase 4: Gamification
Woche 8-9   ████████████ Phase 5: Polish

Total: ~9 Wochen für MVP mit allen Features
```

**Realistisch:** +25% Buffer = 11-12 Wochen

---

## Ressourcen-Bedarf

### **Entwicklung**
- **1 Fullstack Developer** (oder AI + Feedback-Loop)
- **Claude API Key** (Anthropic)
- **Zeit für Testing** nach jeder Phase

### **Infrastruktur**
- Vercel Account (Pro Plan: $20/Monat)
- Neon Database (Free Tier für Start)
- Upstash Redis (Free Tier)

### **Tools**
- VS Code / Editor
- Git / GitHub
- Postman / Insomnia (API Testing)
- Browser DevTools

---

## Risiko-Management

### **Hohes Risiko**
1. **AI-Kosten überschreiten Budget**
   - Mitigation: Prompt Caching, Model Selection
   - Plan B: Simplified AI Features

2. **Plan Validation zu komplex**
   - Mitigation: Start mit 3 Validations, dann erweitern
   - Plan B: Manual Review Option

3. **Performance-Probleme**
   - Mitigation: Caching, Database Indexes
   - Plan B: Scale Neon Database

### **Mittleres Risiko**
1. **UX nicht intuitiv genug**
   - Mitigation: User Testing nach Phase 3
   - Plan B: Simplified Flows

2. **Edge Cases in Natural Language Parsing**
   - Mitigation: Fallback zu Form-Input
   - Plan B: Hybrid Approach

### **Niedriges Risiko**
1. **Authentication Issues**
   - Mitigation: BetterAuth ist battle-tested

2. **Database Performance**
   - Mitigation: Neon scales automatisch

---

## Success Metrics (KPIs)

### **Phase 1**
- ✅ User Registration funktioniert
- ✅ Login/Logout funktioniert
- ✅ Dashboard lädt < 2 Sekunden

### **Phase 2**
- ✅ Plan generiert in < 10 Sekunden
- ✅ Plan passed alle Validations
- ✅ Kosten < $0.50 pro Plan

### **Phase 3**
- ✅ Onboarding < 5 Minuten
- ✅ 90% der Constraints korrekt geparsed
- ✅ Feedback speichert erfolgreich

### **Phase 4**
- ✅ Achievements unlock korrekt
- ✅ Streak calculation stimmt
- ✅ Knowledge Graph tracked Konzepte

### **Phase 5**
- ✅ Lighthouse Score > 90
- ✅ Keine kritischen Errors in 24h
- ✅ < 500ms API Response Time (median)

---

## Rollback-Strategie

Jede Phase hat einen **Git Tag**:
```bash
git tag v1.0-phase1  # After Phase 1 complete
git tag v1.0-phase2  # After Phase 2 complete
...
```

Bei Problemen:
```bash
git checkout v1.0-phase2  # Zurück zu letzter stabiler Phase
vercel rollback           # Deployment rollback
```

---

## Team Kommunikation

### **Daily Standups** (async via Comments)
- Was wurde gestern gemacht?
- Was wird heute gemacht?
- Gibt es Blocker?

### **Phase Reviews** (nach jeder Phase)
- Demo der Features
- Test-Resultate besprechen
- Go/No-Go Entscheidung für nächste Phase

### **Weekly Sync** (optional)
- Progress Review
- Risiken besprechen
- Nächste Woche planen

---

## Nächste Schritte

1. ✅ **Read Phase 1 Plan** → [phase-1-foundation.md](./phase-1-foundation.md)
2. ⬜ **Setup Development Environment**
3. ⬜ **Start Phase 1 Implementation**
4. ⬜ **Test Phase 1**
5. ⬜ **Deploy Phase 1 to Vercel Preview**
6. ⬜ **Review & Go to Phase 2**

---

## Dokumentation Verweise

- **TechWiki:** `../techwiki/` - Technische Dokumentation
- **TrainWiki:** `../trainwiki/` - Trainingswissen für AI
- **Docs:** `../docs/` - User-facing Dokumentation

---

## Support

Bei Fragen oder Problemen:
1. Check [troubleshooting.md](./troubleshooting.md)
2. Review entsprechende TechWiki Sektion
3. Create GitHub Issue
4. Ask Claude (mit Context aus BuildWiki + TechWiki)

---

**Last Updated:** 2024-11-14
**Current Phase:** Ready to Start Phase 1
**Version:** 2.0.0-alpha

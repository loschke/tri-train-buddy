# Tri-Train-Buddy - Projektbeschreibung für Nicht-Techniker

## 🎯 Was ist Tri-Train-Buddy?

Tri-Train-Buddy ist eine innovative Webanwendung, die dir als Triathlet:in hilft, dein Training für einen Ironman-Wettkampf optimal zu planen. Statt einen teuren Personal Trainer zu engagieren oder generische Trainingspläne aus dem Internet zu verwenden, erstellt dir die Anwendung einen **personalisierten, KI-gestützten Trainingsplan**, der genau auf deine individuellen Fähigkeiten, Ziele und Lebensumstände zugeschnitten ist.

## 💡 Die Grundidee

Stell dir vor, du hast einen erfahrenen Triathlon-Coach, der:
- Deine aktuellen Leistungsdaten kennt (wie schnell du läufst, wie stark du auf dem Rad bist)
- Weiß, wann dein nächster Wettkampf stattfindet
- Deine persönlichen Einschränkungen berücksichtigt (z.B. "montags habe ich keine Zeit" oder "ich kann maximal 3x pro Woche laufen")
- Dir alle 14 Tage einen neuen, optimal abgestimmten Trainingsplan erstellt
- Auf dein Feedback reagiert ("letzte Woche war zu hart" oder "ich fühle mich super, könnte mehr machen")

Genau das macht Tri-Train-Buddy – nur digital, jederzeit verfügbar und deutlich günstiger als ein menschlicher Coach.

## 🏊‍♂️🚴‍♂️🏃‍♂️ Für wen ist die Anwendung gedacht?

**Zielgruppe**: Ambitionierte Hobby-Triathleten, die sich auf einen Ironman-Wettkampf vorbereiten

**Typische Nutzer:innen**:
- Haben bereits Triathlon-Erfahrung (kein komplettes Anfänger-Tool)
- Trainieren strukturiert und regelmäßig
- Wollen einen individuellen Plan statt "One-Size-Fits-All"
- Schätzen Flexibilität (Anpassung an Geschäftsreisen, Verletzungen, Lebensumstände)
- Suchen nach datenbasierter, wissenschaftlicher Trainingsplanung

**Nicht geeignet für**:
- Komplette Triathlon-Anfänger (fehlt Grundverständnis für Training)
- Menschen, die nur gelegentlich Sport machen
- Profisportler (benötigen menschliche Coaches mit Erfahrung)

## 🚀 Wie funktioniert es? (Der User Journey)

### 1. **Erstmalige Einrichtung (Onboarding)**

Beim ersten Öffnen der Anwendung durchläufst du einen zweiteiligen Setup-Prozess:

#### **Schritt 1: Dein Athletenprofil**
Du gibst grundlegende Informationen zu deinem Wettkampf ein:
- **Wann ist dein Rennen?** (z.B. 5. Juli 2026 – Ironman Hamburg)
- **Was ist dein Zielzeit?** (z.B. "unter 12 Stunden")
- **Welche Trainingsregeln hast du?**
  - "Montags möchte ich Ruhetag"
  - "Ich will am Wochenende die langen Einheiten machen"
  - "Ich schaffe maximal 3x pro Woche Laufen"
  - "Ich kann 2-4x pro Woche Radfahren"
  - "Schwimmen nur 1x pro Woche möglich"
  - "2x pro Woche Krafttraining"

#### **Schritt 2: Deine aktuellen Leistungsdaten**
Du trägst ein, wie fit du gerade bist:
- **Laufschwelle** (z.B. "ich kann 10 km in 5:50 min/km laufen")
- **Lauftoleranz** (z.B. "maximal 50 km pro Woche, sonst Verletzungsgefahr")
- **FTP (Functional Threshold Power)** – Deine Radleistung in Watt (z.B. 200 Watt)
- **Schwimmtempo** (z.B. "2:10 Minuten pro 100 Meter")
- **Trainingsbereitschaft** (optional, z.B. "heute fühle ich mich bei 75/100")
- **Trainingsbelastung** (optional, z.B. "aktuell 214 von maximal 300 Trainingseinheiten")

Diese Daten helfen der KI, deinen aktuellen Fitnesszustand zu verstehen.

---

### 2. **Dein erster Trainingsplan (14 Tage)**

Nachdem du das Onboarding abgeschlossen hast, klickst du auf **"Neuen Trainingsplan erstellen"**.

**Was passiert im Hintergrund?**
Die Anwendung nutzt künstliche Intelligenz (Claude AI von Anthropic), um einen maßgeschneiderten Plan zu generieren. Die KI berücksichtigt dabei:

1. **Periodisierung**: Wie viele Wochen sind es noch bis zum Wettkampf?
   - **16+ Wochen bis Rennen** → Grundlagenausdauer-Phase (viel lockeres Training)
   - **8-16 Wochen** → Aufbauphase (mehr Intensität, höheres Volumen)
   - **4-8 Wochen** → Spitzenform-Phase (wettkampfspezifisches Training)
   - **0-4 Wochen** → Taper (Volumen reduzieren, frisch zum Rennen)

2. **Deine persönlichen Regeln**
   - Montags immer Ruhetag? → Wird eingehalten
   - Maximal 50 km Laufen pro Woche? → Wird nicht überschritten
   - 2x Krafttraining? → Wird eingeplant

3. **80/20-Regel**
   - 80% des Trainings in niedriger Intensität (Zone 1-2, "locker plaudern")
   - 20% in höherer Intensität (Schwellentraining, Intervalle)

4. **Brick-Workouts**
   - Mindestens 1x pro Zyklus: Radfahren direkt gefolgt von Laufen
   - Trainiert den Übergang wie im Wettkampf

**Das Ergebnis**: Ein Plan mit 14 Trainingstagen, jeder Tag enthält:
- **Sportart** (Laufen, Radfahren, Schwimmen, Krafttraining oder Ruhetag)
- **Dauer** (z.B. 60 Minuten)
- **Intensität** (z.B. "Zone 2 – lockeres Tempo")
- **Detaillierte Beschreibung** (z.B. "10 Min Einlaufen, 40 Min bei 6:20 min/km, 10 Min Auslaufen")

---

### 3. **Dashboard: Dein Trainings-Cockpit**

Nach der Planerstellung landest du auf dem **Dashboard** – dein täglicher Startpunkt.

**Was siehst du?**

#### **Statistiken auf einen Blick**
- **"Diese Woche"**: 5 von 7 Einheiten abgeschlossen (71%)
- **"Aktiver Zyklus"**: Woche 1 von 2 (11. Nov - 24. Nov)
- **"Nächste Aktion"**: Radfahren am Mittwoch, 14:00 Uhr

#### **Die nächsten 7 Tage**
Eine übersichtliche Liste aller anstehenden Trainingseinheiten:

```
Montag, 11. Nov
🧘 RUHETAG
Kompletter Erholungstag – aktive Regeneration

Dienstag, 12. Nov
🏃 LAUFEN | 60 Min | Zone 2
10 Min Einlaufen, 40 Min lockeres Tempo (6:20/km), 10 Min Auslaufen
[ ] Erledigt

Mittwoch, 13. Nov
🚴 RADFAHREN | 90 Min | Zone 2
Lockere Grundlagenausdauer, flaches Terrain bevorzugt
[ ] Erledigt
```

Du kannst jede Einheit als **"Erledigt"** markieren und optional Notizen hinzufügen ("war zu schwer" oder "super gelaufen").

---

### 4. **Metriken aktualisieren**

Alle paar Wochen solltest du deine Leistungsdaten aktualisieren (z.B. nach einem Test):
- Neue Laufschwelle: jetzt 5:40 statt 5:50? → Eintragen!
- FTP auf 210 Watt gestiegen? → Aktualisieren!

Die KI nutzt diese neuen Daten für den nächsten Trainingszyklus.

---

### 5. **Nächster Zyklus (nach 14 Tagen)**

Nach Ablauf der 14 Tage erstellst du einen neuen Plan. Dabei kannst du:

#### **Feedback geben**
"Letzter Zyklus war perfekt, könnte etwas mehr sein"
"Zu hart, hatte Knieschmerzen nach langen Läufen"
"Fühlte mich super, keine Probleme"

#### **Einschränkungen angeben**
"15.-17. November Geschäftsreise, nur Indoor-Training möglich"
"20.-24. November Schulferien, maximal flexibel"
"12. November Radrennen geplant"

Die KI passt den neuen Plan entsprechend an!

---

### 6. **Fortschritt verfolgen**

Im Bereich **"Fortschritt"** siehst du:
- **Gesamtstatistik**: 85% aller Einheiten abgeschlossen
- **Wöchentliches Trainingsvolumen** (als Balkendiagramm)
  - Wie viele Minuten Laufen pro Woche?
  - Wie viele Minuten Radfahren?
  - Trend über die letzten 8 Wochen

So erkennst du, ob du kontinuierlich trainierst oder ob es Lücken gibt.

---

## 🎨 Was macht die Anwendung besonders?

### ✅ **Individualisierung**
Kein generischer "Ironman-Plan für alle". Die KI berücksichtigt:
- Deine aktuellen Fähigkeiten
- Deine zeitlichen Möglichkeiten
- Deine körperlichen Grenzen (Verletzungsprophylaxe!)
- Deine Lebensumstände (Reisen, Familie, Job)

### ✅ **Wissenschaftlich fundiert**
Basiert auf bewährten Trainingsprinzipien:
- Periodisierung (richtige Phase zum richtigen Zeitpunkt)
- 80/20-Regel (verhindert Übertraining)
- Progressive Belastungssteigerung
- Regenerationsphasen

### ✅ **Flexibilität**
- Plan passt sich an dein Feedback an
- Du kannst Einschränkungen jederzeit kommunizieren
- Keine starren 20-Wochen-Pläne, sondern rollende 14-Tage-Zyklen

### ✅ **Einfach zu bedienen**
- Kein Excel-Chaos
- Keine komplizierten Formeln
- Klare, visuelle Darstellung
- Mobile-optimiert (unterwegs nutzbar)

---

## 🔮 Wohin geht die Reise? (Version 2.0 Vision)

Die aktuelle Version ist ein **MVP (Minimum Viable Product)** – eine voll funktionsfähige Basisversion. Für Version 2.0 sind viele spannende Features geplant:

### **Geplante Verbesserungen**
1. **Kalender-Integration**
   - Automatischer Export zu Google Calendar
   - Erinnerungen für anstehende Einheiten

2. **Geräte-Synchronisation**
   - Verbindung mit Garmin, Strava, Polar
   - Automatischer Import von abgeschlossenen Trainings
   - Keine manuelle Eingabe mehr nötig

3. **Erweiterte Analysen**
   - Detaillierte Fortschrittscharts
   - Vergleich mit früheren Trainingszyklen
   - Prognose für Wettkampfzeit

4. **Ernährungsplanung**
   - Makro-Empfehlungen (Kohlenhydrate, Protein, Fett)
   - Wettkampf-Verpflegungsplan

5. **Community-Features**
   - Teile deine Pläne mit Trainingspartnern
   - Vergleiche dich mit anderen (optional)

6. **Mobile App**
   - Native iOS/Android-App
   - Offline-Zugriff auf Trainingspläne

---

## 📊 Aktueller Status (Version 1.0)

### **Was funktioniert heute?**
✅ Benutzer-Authentifizierung (Login/Logout)
✅ Onboarding mit Athletenprofil + Metriken
✅ KI-gestützte Planerstellung (Claude AI)
✅ Dashboard mit Übersicht
✅ Detailansicht aller 14 Trainingstage
✅ Einheiten als "Erledigt" markieren
✅ Fortschrittsverfolgung mit Charts
✅ Metriken-Aktualisierung
✅ Account-Einstellungen

### **Was fehlt noch?**
⏳ Kalender-Export
⏳ Geräte-Integration (Garmin/Strava)
⏳ E-Mail-Benachrichtigungen
⏳ Multi-User-Unterstützung (derzeit nur 1 Nutzer)
⏳ Mobile App

---

## 🏗️ Technische Grundlagen (vereinfacht erklärt)

### **Wie ist die Anwendung gebaut?**

Stell dir die Anwendung wie ein Haus vor:

#### **Das Fundament (Datenbank)**
Eine PostgreSQL-Datenbank speichert alle deine Daten:
- Dein Benutzerkonto
- Dein Athletenprofil
- Alle Trainingszyklen
- Alle einzelnen Trainingseinheiten
- Deine Leistungshistorie

#### **Die Räume (Backend)**
Ein Next.js-Server kümmert sich um:
- Sicherheit (nur du kannst deine Daten sehen)
- Kommunikation mit der KI (Claude API)
- Datenverarbeitung (Statistiken berechnen)
- Regeln durchsetzen (z.B. "maximal 50 km Laufen pro Woche")

#### **Die Fassade (Frontend)**
Eine React-Weboberfläche zeigt dir:
- Dein Dashboard
- Deine Trainingspläne
- Formulare zur Dateneingabe
- Charts und Statistiken

#### **Der intelligente Assistent (KI)**
Claude AI (von Anthropic) ist wie ein virtueller Coach:
- Versteht natürliche Sprache
- Kennt Trainingsprinzipien
- Generiert individuelle Pläne
- Lernt aus deinem Feedback

---

## 💰 Kosten & Betrieb

### **Laufende Kosten** (monatlich)
- **Datenbank-Hosting** (Neon): ~0-5 € (kostenlos bis 0,5 GB)
- **Web-Hosting** (Vercel): Kostenlos für private Nutzung
- **Claude API**: ~0,50-2 € pro Monat (abhängig von Nutzung)
  - 1 Planerstellung ≈ 0,05-0,10 €
  - 2 Pläne pro Monat = ~0,20 € API-Kosten

**Gesamtkosten für 1 Nutzer**: ~1-5 € pro Monat (vs. 100-300 € für Personal Trainer)

### **Einmalige Kosten**
- Entwicklung: Bereits abgeschlossen (MVP fertig)
- Domain: Optional, ~12 € pro Jahr

---

## 🎯 Zusammenfassung: Warum Tri-Train-Buddy?

| **Problem** | **Lösung durch Tri-Train-Buddy** |
|-------------|-----------------------------------|
| Personal Trainer zu teuer | KI-Coach für einen Bruchteil der Kosten |
| Generische Pläne aus dem Internet | Individualisiert auf deine Daten |
| Starre 20-Wochen-Pläne | Flexible 14-Tage-Zyklen |
| Keine Anpassung bei Verletzung/Reise | Feedback & Constraints einbaubar |
| Excel-Chaos | Übersichtliches Dashboard |
| Keine Fortschrittsverfolgung | Detaillierte Statistiken & Charts |

---

## 🚀 Nächste Schritte

Wenn du Tri-Train-Buddy nutzen möchtest:

1. **Account anlegen** (aktuell manuell, später automatisch)
2. **Onboarding durchlaufen** (5-10 Minuten)
3. **Ersten Plan generieren** lassen
4. **Loslegen mit dem Training!**

Alle 14 Tage einen neuen Plan erstellen und dein Feedback einfließen lassen – so einfach kann strukturiertes Triathlon-Training sein!

---

**Version**: 2.0 Dokumentation
**Erstellt**: 14. November 2025
**Status**: MVP läuft, v2.0 in Planung
**Zielgruppe**: Hobby-Triathleten mit Ironman-Ambitionen

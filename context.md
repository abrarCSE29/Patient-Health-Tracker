# Patient Health Tracker — Reusable Project Context

## What this app is
This is a **full-stack patient health tracker** for managing overall healthcare records across one or multiple patient profiles (self/dependents).

Core capabilities implemented:
- Manage **patient profiles**
- Add/manage **medications** with morning/afternoon/night dosage and meal timing
- Export **medication roster PDF**
- Manage **doctors**
- Add/track **doctor visits**
- Add/track **test reports** (metadata flow in place; file upload UI present)
- Dashboard with profile-aware summaries

---

## Tech stack
- **Frontend:** React 19, TypeScript, Vite, React Router
- **Backend:** Express (`server.ts`) with REST endpoints
- **Database:** Prisma + SQLite (`prisma/dev.db`) using `@prisma/adapter-libsql`
- **PDF:** `@react-pdf/renderer` (`src/components/MedicationRosterPDF.tsx`)
- **State/data:** Context + custom `useData` hook
- **Auth (prototype):** localStorage-backed mock auth (`AuthContext`)

---

## High-level architecture

### Frontend
- `src/App.tsx`
  - Protected routes for authenticated users
  - Wraps app with `AuthProvider` and `PatientProvider`
- `src/components/Layout.tsx`
  - Global shell (sidebar + navigation + user menu)
- `src/context/AuthContext.tsx`
  - Mock login/logout and session persistence in localStorage
- `src/context/PatientContext.tsx`
  - Holds active profile (`activeProfileId`) used across pages
- `src/hooks/useData.ts`
  - Generic GET hook + `postData` helper for POST requests

### Backend
- `server.ts`
  - Express server + JSON parsing
  - REST API for medications, doctors, visits, profiles, reports
  - Vite middleware in development, static serving in production
- `src/lib/db.ts`
  - Prisma client singleton using libsql adapter

### Database schema
- `prisma/schema.prisma`
  - Main entities: `User`, `Profile`, `Medication`, `Doctor`, `Visit`, `Report`

---

## Data model and relationships (Prisma source of truth)
- `User` 1—N `Profile`
- `Profile` 1—N `Medication`
- `Profile` 1—N `Visit`
- `Profile` 1—N `Report`
- `Doctor` 1—N `Visit`

Important model fields:
- **Medication**: `name`, `startDate`, `endDate`, `durationDays`, dosage split by day-part, meal timing, `status`
- **Visit**: `date`, `time`, `reason`, `diagnosis`, `status`, `doctorId`, `profileId`
- **Report**: `title`, `date`, `type`, `result`, `status`, `doctorId?`, `profileId`

---

## API surface (from `server.ts`)

### Health
- `GET /api/health`

### Medications
- `GET /api/medications?profileId=...`
- `POST /api/medications`
- `PUT /api/medications/:id`
- `DELETE /api/medications/:id`

### Doctors
- `GET /api/doctors`
- `POST /api/doctors`

### Visits
- `GET /api/visits?profileId=...`
- `POST /api/visits`
- `PUT /api/visits/:id`
- `DELETE /api/visits/:id`

### Profiles
- `GET /api/profiles`
- `POST /api/profiles`

### Reports
- `GET /api/reports?profileId=...`
- `POST /api/reports`

---

## Main page responsibilities
- `Dashboard.tsx`
  - Profile switcher, upcoming visits, active meds summary, day-part medication lists
- `Medications.tsx`
  - CRUD medications, status updates, dosage + meal timing, PDF export
- `Doctors.tsx`
  - Add/list doctors
- `Visits.tsx`
  - Schedule/edit/delete visits and move between upcoming/past
- `Reports.tsx`
  - Add/list report metadata, search/filter UI
- `Profiles.tsx`
  - Add/list/select profiles and show medical info
- `Notifications.tsx`
  - Notification UI/preferences (mostly static/mock currently)
- `Login.tsx`
  - Mock sign-in flow

---

## Business workflows currently supported
1. User logs in (mock auth)
2. User selects active profile (or default first profile)
3. User manages medications/visits/reports scoped to active profile
4. User exports medication chart PDF for current data

---

## Notable implementation details and caveats
- Backend includes prototype fallbacks:
  - Auto-picks first profile/doctor in some create flows if ID missing
  - Auto-creates a default user when creating first profile without userId
- Medication `endDate` can be calculated from `startDate + durationDays`
- PDF export uses active medications grouped by meal timing and includes follow-up visits

### Recent UI theming updates
- `src/components/Layout.tsx` updated with a calmer, soothing shell theme:
  - Soft gradient page background
  - Glassy/semi-transparent sidebar and top header
  - Indigo/violet active navigation treatment
  - Improved focus/hover states for better accessibility
- `src/pages/Dashboard.tsx` updated for better visual separation from the new shell:
  - Color-tinted stat cards with distinct tone mapping
  - Upgraded appointment cards with stronger contrast and visual emphasis
  - Morning/Afternoon/Night medication routine sections now have dedicated tinted containers, borders, and dividers to avoid blending into the page background
  - Medication row chips/actions are now time-slot color aware for faster scanning
- App-wide accent update applied across remaining pages to ensure consistent visual language:
  - Primary action color shifted from neutral black to indigo/violet gradient accents
  - Focus rings standardized to softer indigo tones (`focus:ring-indigo-300`)
  - Key headings/actions tuned to slate + indigo hierarchy for calmer readability
  - Updated pages: `Medications.tsx`, `Doctors.tsx`, `Visits.tsx`, `Reports.tsx`, `Profiles.tsx`, `Notifications.tsx`, `Login.tsx`

### Known gaps / inconsistencies to remember
- `src/types/index.ts` appears **out of sync** with current Prisma schema/pages (legacy shape)
- `useData` signature is `url: string`, while some pages pass nullable values (typing mismatch risk)
- Notifications are mostly mock UI (no persistent backend flow)
- Reports page has upload UI, but full file storage pipeline is not wired in backend

---

## Useful files for future edits
- Core server/API: `server.ts`
- DB schema: `prisma/schema.prisma`
- DB client: `src/lib/db.ts`
- Routing/shell: `src/App.tsx`, `src/components/Layout.tsx`
- Dashboard UI theming: `src/pages/Dashboard.tsx`
- Shared data contexts: `src/context/AuthContext.tsx`, `src/context/PatientContext.tsx`
- Data hooks: `src/hooks/useData.ts`
- Medication PDF: `src/components/MedicationRosterPDF.tsx`
- Domain pages: `src/pages/*.tsx`

---

## Quick start reminders
- Install: `npm install`
- Run dev server: `npm run dev`
- Prisma client generation runs postinstall

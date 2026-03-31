# Patient Health Tracker

A full-stack patient health tracker for caregivers and families to manage health information across one or more patient profiles.

## Features

- Secure authentication with:
  - short-lived JWT access tokens
  - HttpOnly refresh-token cookies
- Strict per-user data isolation
- Multi-profile support (self/dependents)
- Profile-specific doctor lists
- Medication management with day-part scheduling
- Medication PDF export
- Doctor visit management
- Test report management with:
  - file upload to Azure Blob Storage
  - signed/suffixed view and download links
  - edit support
  - archive/unarchive support
  - archived reports modal

## Tech Stack

- **Frontend:** React, TypeScript, Vite, React Router
- **Backend:** Express, TypeScript
- **Database:** Prisma + SQLite
- **Storage:** Azure Blob Storage
- **Auth:** JWT + refresh cookies
- **PDF:** `@react-pdf/renderer`

## Environment Variables

Configure all secrets in `.env`:

```env
DATABASE_URL="file:.\prisma\dev.db"
APP_URL="http://localhost:3000"

JWT_ACCESS_SECRET="replace_with_strong_access_secret"
JWT_REFRESH_SECRET="replace_with_strong_refresh_secret"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"

AZURE_STORAGE_CONNECTION_STRING="replace_with_azure_storage_connection_string"
AZURE_STORAGE_CONTAINER_NAME="reports"
AZURE_BLOB_SIGNATURE="replace_with_blob_signature_string"
```

### Azure notes

- `AZURE_STORAGE_CONTAINER_NAME` is the blob container
- `AZURE_BLOB_SIGNATURE` is appended to file URLs for view/download
- Uploaded reports are stored inside the container under a profile-specific folder path:
  - `<profileId>/<timestamp>-<filename>`

## Installation

```bash
npm install
```

## Database Setup

Push the Prisma schema and generate the client:

```bash
npx prisma db push
npx prisma generate
```

Optional seed:

```bash
npx tsx prisma/seed.ts
```

## Run Locally

```bash
npm run dev
```

App runs at:

```text
http://localhost:3000
```

## Core Workflows

### Authentication

- Create account from the login page
- Login with email/password
- Automatic session refresh via refresh cookie

### Profiles

- Create profiles for self or dependents
- Edit profile details
- Delete profiles
- Profile switching updates all scoped data

### Doctors

- Doctors belong to a specific patient profile
- Create and update doctor records per profile

### Medications

- Add/edit/delete medications
- Medication name required
- Toggle Morning / Afternoon / Night dosage sections
- Export medication PDF for the active profile

### Reports

- Upload report metadata and file
- Files stored in Azure Blob Storage
- View/download using signed URL suffix
- Attach doctor to report
- Edit report metadata / replace file
- Archive and unarchive reports
- View archived reports in a separate modal

## Important Scoping Rules

- Users only see their own profiles
- Profiles only show their own doctors
- Medications, visits, and reports are scoped to the active profile
- Backend enforces ownership checks for protected resources

## Key Files

- `server.ts` — Express API and auth/upload routes
- `prisma/schema.prisma` — database schema
- `src/lib/db.ts` — Prisma client
- `src/lib/blob.ts` — Azure Blob upload helper
- `src/context/AuthContext.tsx` — auth/session handling
- `src/context/PatientContext.tsx` — active profile state
- `src/pages/Reports.tsx` — report upload/archive/edit UI
- `src/pages/Medications.tsx` — medication + PDF export UI
- `src/pages/Doctors.tsx` — profile-specific doctors UI
- `src/pages/Profiles.tsx` — profile management UI

## Validation Commands

```bash
npm run lint
```

## Current Notes

- SQLite is used for local development
- Azure Blob upload requires valid Azure credentials in `.env`
- If you change Prisma schema, rerun:

```bash
npx prisma db push
npx prisma generate
```

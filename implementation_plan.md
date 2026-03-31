# Implementation Plan

[Overview]
Implement strict per-user data isolation so each caregiver only sees and manages their own profiles and profile-linked health records.

The current system already has a `User -> Profile` relationship in Prisma, but runtime behavior is not scoped to the authenticated user. The frontend login is mock/localStorage-only and backend routes currently fetch global profile lists and allow prototype fallbacks that assign records to the first/default user/profile. This allows cross-account visibility and creates data ownership ambiguity.

The implementation will introduce secure authentication using short-lived access tokens and HttpOnly refresh-token cookies, enforce ownership checks at API boundaries, and remove unsafe fallback behavior. Profile switching will remain the UX mechanism for selecting dependents, but available profiles will be filtered to the logged-in caregiver. All profile-linked resources (medications, visits, reports) will be validated against both `profileId` and owning `userId`.

[Types]
Add explicit authenticated-user and ownership-aware API types to remove ambiguous identity handling.

- `src/types/auth.ts` (new)
  - `export interface AuthenticatedUser { id: string; email: string; name?: string | null }`
  - `export interface AccessTokenPayload { sub: string; email: string; tokenVersion: number; iat: number; exp: number }`
  - `export interface RefreshTokenPayload { sub: string; tokenVersion: number; iat: number; exp: number }`
  - `export interface LoginResponse { accessToken: string; user: AuthenticatedUser }`
  - Validation rules:
    - `id` must be non-empty CUID string (from `User.id`)
    - `email` must be non-empty, normalized to lowercase
- `src/types/api.ts` (new or merged into existing types)
  - `export interface RequestUserContext { userId: string; userEmail: string }`
  - `export interface CreateProfileInput { name: string; relationship: string; age: number; bloodGroup?: string; conditions?: string; allergies?: string; emergencyContact?: string; emergencyPhone?: string }`
  - `export interface ScopedQuery { profileId?: string }`
- Existing page-level usages that currently use `any` in profile-sensitive data flows should migrate to concrete interfaces:
  - `Profile`, `Medication`, `Visit`, `Report` minimal response types used in pages and context.

Database type-level policy (Prisma constraints):
- Keep `Profile.userId` as required ownership anchor.
- Add ownership-safe lookup semantics in code (composite `where` behavior via relation filters), without requiring schema-level composite unique changes.

[Files]
Modify backend and frontend identity/plumbing files to enforce ownership checks end-to-end.

- New files to create:
  - `src/types/auth.ts` — authenticated user type definitions.
  - `src/types/api.ts` — request/response DTOs for scoped operations.
  - `src/lib/auth.ts` — backend helpers to extract/validate request user identity from headers.
  - `src/lib/tokens.ts` — JWT sign/verify helpers for access and refresh tokens.

- Existing files to modify:
  - `server.ts`
    - Add auth endpoints: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`.
    - Add request-level bearer token extraction middleware.
    - Issue short-lived access token in JSON response and set refresh token in HttpOnly cookie.
    - Verify and rotate refresh token on `/api/auth/refresh`.
    - Scope all `/api/profiles` reads/writes to authenticated `userId`.
    - For `/api/medications`, `/api/visits`, `/api/reports`, validate that provided `profileId` belongs to authenticated user before read/create/update/delete.
    - Remove prototype fallbacks that pick `firstProfile` / `firstUser` / `default@example.com`.
    - Return `401` for missing/expired auth and `403` for ownership violations.
  - `src/context/AuthContext.tsx`
    - Replace mock login with API-driven login/refresh/logout/me flow.
    - Keep access token in memory (not localStorage).
    - Use silent refresh on app load and 401 retry paths.
  - `src/hooks/useData.ts`
    - Include `Authorization: Bearer <accessToken>` in fetch wrappers.
    - Add centralized 401 handling with refresh call and token retry once.
    - Support nullable URL safely (`string | null`) and skip fetch when null.
  - `.env` / runtime config
    - Add `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`.
  - `src/context/PatientContext.tsx`
    - Continue loading `/api/profiles`, now implicitly user-scoped.
    - Keep active profile behavior but reset if current active profile no longer belongs to user response.
  - `src/pages/Profiles.tsx`
    - Use `PatientContext` as the source of active profile state (avoid duplicate local active profile state drift).
    - On profile create, rely on server user scope; no client-sent `userId` required.
  - `src/App.tsx`
    - No route changes required, but ensure providers order still supports authenticated data fetches.
  - `prisma/seed.ts`
    - Optional update: create multiple users + per-user profiles to test isolation.
  - `context.md`
    - Document strict per-user isolation design and API auth assumptions.

- Files likely unchanged:
  - `prisma/schema.prisma` can remain unchanged for core ownership (already has `Profile.userId`).

[Functions]
Implement ownership-aware request helpers and refactor route handlers to use them consistently.

- New functions:
  - `signAccessToken(user): string` in `src/lib/tokens.ts`
  - `signRefreshToken(user): string` in `src/lib/tokens.ts`
  - `verifyAccessToken(token): AccessTokenPayload` in `src/lib/tokens.ts`
  - `verifyRefreshToken(token): RefreshTokenPayload` in `src/lib/tokens.ts`
  - `setRefreshCookie(res, token): void` in `src/lib/auth.ts`
  - `clearRefreshCookie(res): void` in `src/lib/auth.ts`
  - `getRequestUser(req): RequestUserContext | null` in `src/lib/auth.ts`
    - Reads bearer access token payload and returns normalized user context.
  - `requireRequestUser(req, res): RequestUserContext | null` in `src/lib/auth.ts`
    - Sends `401` and returns `null` when user context is absent.
  - `assertProfileOwnership(profileId, userId): Promise<boolean>` in `server.ts` helper scope or `src/lib/auth.ts`
    - Confirms profile belongs to current user.

- Modified functions/routes in `server.ts`:
  - `POST /api/auth/login`
    - Validate credentials, issue access token, set refresh cookie.
  - `POST /api/auth/refresh`
    - Validate refresh cookie, rotate refresh token, issue new access token.
  - `POST /api/auth/logout`
    - Clear refresh cookie and invalidate refresh lineage via tokenVersion.
  - `GET /api/auth/me`
    - Return current authenticated user from access token.
  - `GET /api/profiles`
    - Current: returns all profiles.
    - Required: return only `where: { userId: requestUser.userId }`.
  - `POST /api/profiles`
    - Current: fallback to first/default user.
    - Required: always create with authenticated `userId`; remove fallback.
  - `GET /api/medications`, `GET /api/visits`, `GET /api/reports`
    - Current: filter only by optional `profileId`.
    - Required: enforce ownership either by:
      - mandatory valid `profileId` owned by user, or
      - relation filter `where: { profile: { userId: requestUser.userId } }` when listing.
  - `POST/PUT/DELETE` for medications/visits/reports
    - Current: no ownership check.
    - Required: verify target row’s profile owner matches authenticated user; reject otherwise.

- Modified functions in frontend:
  - `login` in `AuthContext`
    - Current: mock user object.
    - Required: call `/api/auth/login`, store access token in memory, rely on cookie for refresh.
  - `refreshSession` in `AuthContext` (new)
    - Calls `/api/auth/refresh` with credentials included.
  - `useData` and `postData`
    - Current: plain fetch.
    - Required: attach bearer token, retry once after refresh, skip null URLs safely.

[Classes]
No new classes are required; this implementation is function- and module-oriented.

- Modified class-like/context constructs:
  - `AuthProvider` in `src/context/AuthContext.tsx`
    - Add authoritative user identity management from backend contract.
  - `PatientProvider` in `src/context/PatientContext.tsx`
    - Preserve active-profile UX while consuming user-scoped profile list.

[Dependencies]
No new package dependencies are strictly required for the isolation MVP.

Required dependency updates:
- Add `jsonwebtoken` for access/refresh JWT signing + verification.
- Add `cookie-parser` for secure HttpOnly refresh cookie handling.
- Add `bcryptjs` (or `bcrypt`) for password hash validation during login.

Optional hardening:
- `zod` for request payload validation.

[Testing]
Validate isolation via route-level authorization scenarios and profile-switching behavior checks.

- Add API tests (or scripted integration checks) for:
  - login returns access token and sets HttpOnly refresh cookie.
  - refresh rotates token and returns new access token.
  - logout clears cookie and blocks refresh reuse.
  - user A cannot list user B profiles.
  - user A cannot read/create/update/delete meds/visits/reports under user B profile.
  - profile switching only shows user-owned profiles and data changes across all pages.
- Add regression checks for:
  - no default/first-user fallback in profile creation.
  - null URL handling in `useData` does not trigger failed fetches.
  - 401 -> refresh -> retry succeeds once, then fails cleanly when refresh invalid.
- Manual validation flow:
  - Login as `john@gmail.com`, create `Mary`/`Father` profiles.
  - Switch profiles and verify dashboard/medications/visits/reports scope correctly.
  - Login as second user and confirm zero visibility into John’s data.

[Implementation Order]
Implement backend identity enforcement first, then wire frontend identity propagation, then validate profile-scoped UX.

1. Add JWT + cookie infrastructure (`tokens.ts`, cookie parser, env secrets, token TTL config).
2. Implement auth endpoints (`login/refresh/logout/me`) with refresh-cookie rotation.
3. Add access-token middleware and require auth for profile/health-data APIs.
4. Enforce ownership on `/api/profiles` and remove first/default user/profile fallbacks.
5. Enforce ownership checks on all medications/visits/reports endpoints (read/write/delete).
6. Refactor `AuthContext` to API auth flow with in-memory access token + silent refresh.
7. Refactor `useData` / `postData` to bearer-token + auto-refresh retry model.
8. Align `PatientContext` + `Profiles` page state to single source of truth for active profile.
9. Update seed/dev data for multi-user verification and run manual/auth-isolation tests.
10. Document token model + isolation behavior in `context.md`.
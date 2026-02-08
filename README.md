# Priming Effect Study Web App

Next.js app for running a two-question priming study with:
- participant validation and single submission per browser session
- admin login
- open/close study sessions
- session history
- random test data generation
- two-line chart (Answer 1 and Answer 2)
- Pearson correlation and linear regression summary

## Stack

- Next.js (App Router)
- Prisma ORM
- Neon Postgres
- Chart.js via `react-chartjs-2`

## 1. Configure Environment

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
ADMIN_PASSWORD="your-strong-admin-password"
```

## 2. Install and Generate Prisma Client

```bash
npm install
npx prisma generate
```

## 3. Create Database Tables

Run one of:

```bash
npx prisma migrate dev --name init
```

or, if you only want to sync schema quickly:

```bash
npx prisma db push
```

## 4. Run Locally

```bash
npm run dev
```

- Participant page: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

## Admin Workflow

1. Login with `ADMIN_PASSWORD`.
2. Start a study session.
3. Collect participant answers.
4. View chart/statistics in admin mode.
5. Close session when done.
6. Use session history to review prior runs.

## Notes

- Participant submission is blocked when no session is open.
- Only one submission is allowed per browser session (cookie-based lock).
- Random data generation supports `correlated` mode (tests expected priming pattern).
- Random data generation supports `independent` mode (null-like baseline).

## Project State / Handoff

Use this section if you continue work in a new chat.

### Implemented Features

- Participant page with two numeric questions.
- Validation on client and server:
  - `answer1` must be integer `1..100`
  - `answer2` must be integer `0..1000`
- Submission allowed only when a study session is `OPEN`.
- One submission per browser session (cookie lock + DB uniqueness).
- Admin login with password from `ADMIN_PASSWORD`.
- Admin controls:
  - start session
  - close active session
  - generate random responses (correlated/independent)
  - clear selected session responses
  - delete all sessions + responses
- Session history table.
- Analytics for selected session:
  - two-line chart (`Answer 1`, `Answer 2`)
  - Pearson correlation
  - simple linear regression (`y = ax + b`)
  - short interpretation text

### Data Model (Prisma)

- `StudySession`
  - `id`, `name`, `status` (`OPEN`/`CLOSED`), `startedAt`, `closedAt`
- `Response`
  - `id`, `sessionId`, `participantKey`, `answer1`, `answer2`, `createdAt`
- Constraint:
  - `@@unique([sessionId, participantKey])` prevents duplicate submit within the same session for the same browser token.

### Key Routes

- `/` participant form
- `/admin/login` admin authentication
- `/admin` admin dashboard

### Key Files

- Participant submit logic: `src/app/actions/participant.ts`
- Admin actions: `src/app/actions/admin.ts`
- Admin page: `src/app/admin/page.tsx`
- Admin login page: `src/app/admin/login/page.tsx`
- Validation: `src/lib/validation.ts`
- Stats/correlation: `src/lib/stats.ts`
- Auth cookie helpers: `src/lib/admin-auth.ts`
- Prisma schema: `prisma/schema.prisma`

### First Commands In A Fresh Clone

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

If you cannot run migrations in the current environment, use:

```bash
npx prisma db push
```

### Deployment Notes (Neon)

- Set `DATABASE_URL` to Neon pooled connection string with `sslmode=require`.
- Set a strong `ADMIN_PASSWORD`.
- For Vercel/Render/Railway, run `prisma generate` during build and run migrations in deploy pipeline or manually.

### Known Gaps / Next TODO

- Replace basic admin password check with stronger auth (e.g., NextAuth or provider auth).
- Add automated tests for participant validation, duplicate lock, and session lifecycle.
- Optional: add p-value/significance testing for correlation.

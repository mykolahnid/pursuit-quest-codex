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
- Random data generation supports:
  - `correlated` mode (for testing expected priming pattern)
  - `independent` mode (for null-like baseline)


# Lethologica

> *Lethologica* (n.) — the inability to remember a word you know is there; the tip-of-the-tongue phenomenon.

**Lethologica** is a full-stack vocabulary learning app that uses spaced repetition to help users actually retain words — not just see them once and forget them. Each day a user is shown a word and asked to identify its definition from four choices. Based on how well they knew it, the app schedules the next review at a scientifically optimal interval: words you know well come back less often, words you struggle with come back sooner.

🔗 **Live:** [lethologica.nylesgeiger.com](https://lethologica.nylesgeiger.com)  

---

## What it does

- **Daily word review** — users are shown one word at a time with four definition choices. The correct answer is mixed with three random definitions from the word bank.
- **Spaced repetition** — after answering, users rate their recall (0–5). The app uses the SM-2 algorithm to calculate when they should see that word again.
- **Review history** — users can scroll back through words they've reviewed this session, seeing which choices they made.
- **Word lists** — users can save words to named lists and share those lists with other users at configurable permission levels (viewer or editor).
- **Audio pronunciation** — each word card includes a button to hear the pronunciation, sourced from the Merriam-Webster audio API.

---

## Tech Stack

| | Technology |
|---|---|
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL |
| **Auth** | JWT + bcrypt |
| **Validation** | Zod |
| **Logging** | Pino + Morgan |
| **Testing** | Vitest + Supertest (36 tests) |
| **Frontend** | React, Vite, TypeScript, shadcn/ui |
| **Hosting** | AWS EC2 + Nginx + PM2 (backend), Vercel (frontend) |
| **SSL** | Certbot / Let's Encrypt |
| **Secrets** | AWS SSM Parameter Store |
| **CI/CD** | GitHub Actions |

---

## Architecture highlights

### SM-2 Spaced Repetition Algorithm

The core of the app is an implementation of **SM-2** — the same algorithm that powers Anki, one of the most widely used flashcard apps in the world. After each review, the algorithm calculates two things:

**Ease factor** — a per-word multiplier that adjusts based on performance. Getting a word wrong repeatedly lowers its ease factor, causing it to appear more frequently.

**Review interval** — how many days until the word appears again. Starts at 1 day, grows to 6 days, then scales by the ease factor on every subsequent correct answer.

The SM-2 function is implemented as a **pure function** — it takes the current progress state and a rating, returns the new state, with no side effects. This makes it independently testable without touching a database or starting a server.

### Role-Based Access Control (RBAC)

List sharing uses a three-tier permission model:

| Role | Can view | Can edit | Can manage shares |
|---|---|---|---|
| Owner | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ❌ |
| Viewer | ✅ | ❌ | ❌ |

Permission checks are handled by a **middleware factory** — `requirePermission('canEdit')` returns an Express middleware function that queries the database for the user's current role before every protected request. The client never has a say in what it's allowed to do; the server always decides based on live database state.

### Custom Migration Runner

Rather than using a third-party migration library, the migration system is built from scratch. SQL files in `src/db/migrations/` are numbered sequentially and tracked in a `migrations` table in the database. The runner:

- Skips files already recorded in the tracking table
- Records each migration **inside the loop** immediately after it runs — so if migration 4 fails, migrations 1–3 are recorded and only 4 retries on the next run
- Runs automatically in the CI/CD pipeline before tests

### CI/CD Pipeline with Test Gate

Every push to `main` triggers a GitHub Actions workflow that:

1. Spins up a **fresh PostgreSQL service container**
2. Runs all 36 tests against it (unit + integration)
3. Only deploys to EC2 if every test passes

This means broken code can never reach production. The deploy step SSHs into the EC2 instance, pulls the latest code, rebuilds, fetches secrets from AWS SSM Parameter Store, and restarts the app via PM2 — zero manual steps.

### Single Source of Truth

A principle applied throughout: **the server always fetches its own state before computing updates.** When a user submits a word rating, the client sends only the rating (0–5). The server fetches the current progress record, runs SM-2, and writes the result. The client cannot manipulate its own progress data by sending a modified state object.

The same principle applies to permissions — rather than trusting a role value the client might send, every permission check is a fresh database query.

---

## Local Setup

### Prerequisites
- Node.js v22+
- pnpm
- PostgreSQL 18

### Database

Connect as a PostgreSQL superuser:

```sql
CREATE DATABASE lethologica_db;
CREATE DATABASE lethologica_test_db;
CREATE USER lethologica_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE lethologica_db TO lethologica_user;
GRANT ALL PRIVILEGES ON DATABASE lethologica_test_db TO lethologica_user;
ALTER DATABASE lethologica_db OWNER TO lethologica_user;
ALTER DATABASE lethologica_test_db OWNER TO lethologica_user;
```

Then connect to each database and run:
```sql
GRANT ALL ON SCHEMA public TO lethologica_user;
```

> PostgreSQL 15+ revokes schema-level create rights by default. This grant is required separately from the database-level grant.

### Environment Variables

Copy `.env.example` to `.env`:

```
DATABASE_URL=postgresql://lethologica_user:yourpassword@localhost:5432/lethologica_db
TEST_DATABASE_URL=postgresql://lethologica_user:yourpassword@localhost:5432/lethologica_test_db
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3000
```

> Avoid special characters (`#`, `$`, `@`) in your database password — these break URL parsing.

### Running the app

```bash
cd backend
pnpm install
pnpm db:migrate    # creates all tables
pnpm db:seed       # populates the word bank
pnpm dev           # starts the dev server with hot reload
```

### Running tests

```bash
cd backend
pnpm test
```

---

## API Overview

All routes except `/api/auth/register` and `/api/auth/login` require a JWT in the `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/words/today` | Next word or review |
| PATCH | `/api/words/:wordId/review` | Submit rating (0–5) |
| GET | `/api/words/history` | All reviewed words |
| GET | `/api/words/random` | Random words (for wrong answers) |
| GET | `/api/lists` | All owned and shared lists |
| POST | `/api/lists` | Create a list |
| GET | `/api/lists/:listId` | List metadata |
| GET | `/api/lists/:listId/words` | Words in a list |
| PATCH | `/api/lists/:listId` | Rename (editor+) |
| DELETE | `/api/lists/:listId` | Delete (owner only) |
| POST | `/api/lists/:listId/words/:wordId` | Add word (editor+) |
| DELETE | `/api/lists/:listId/words/:wordId` | Remove word (editor+) |
| GET | `/api/lists/:listId/shares` | View shares (owner only) |
| POST | `/api/lists/:listId/shares` | Share with a user (owner only) |
| PATCH | `/api/lists/:listId/shares/:shareId` | Update role (owner only) |
| DELETE | `/api/lists/:listId/shares/:shareId` | Revoke access (owner only) |

---

## Known Limitations

- **Quiz validation is client-side.** The correct definition is included in the word payload sent to the browser. A determined user could inspect the network response to find the answer without the server knowing. A production implementation would validate answers server-side.
- **Word history is per-browser.** Review history for the back-navigation feature is stored in localStorage — it doesn't sync across devices and clears on logout.
- **Word bank is fixed.** Users cannot add their own words in the current version.
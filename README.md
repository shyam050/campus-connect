# 🎓 CampusConnect — Placement Drive Hub

A full-stack MERN placement portal used across a 300+ student department: **role-based access control** (student / coordinator / admin), eligibility-filtered job listings, **automated deadline reminders** (node-cron + Bull), application tracking with resume uploads (Cloudinary), a personal **prep tracker** with streaks, and **live analytics** from MongoDB aggregation pipelines.

## Feature Matrix (RBAC)

|                     | Student | Coordinator | Admin |
| ------------------- | :-----: | :---------: | :---: |
| View jobs           |    ✓    |      ✓      |   ✓   |
| Apply to job        |    ✓    |      ✗      |   ✗   |
| Post / edit jobs    |    ✗    |      ✓      |   ✓   |
| View applicants     |    ✗    |      ✓      |   ✓   |
| Update status/notes |    ✗    |      ✓      |   ✓   |
| Send reminders      |    ✗    |      ✓      |   ✓   |
| Manage users        |    ✗    |      ✗      |   ✓   |
| Analytics           |    ✗    |      ✗      |   ✓   |

Every gate is enforced **twice** — by `authenticate` + `authorize(...roles)` middleware on the API, and by route guards + role-scoped navigation in the React app.

## Tech Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router 6, Recharts, lucide-react, react-hot-toast |
| Backend  | Node.js, Express 4, TypeScript, Zod (validation), Helmet, express-rate-limit |
| Database | MongoDB Atlas / local, via Mongoose 8 |
| Uploads  | Cloudinary (CDN, `resource_type: raw`) with automatic **local-disk fallback** when unconfigured |
| Email    | Nodemailer templates; **Bull + Redis** queue (falls back to direct sends without Redis); **node-cron** scheduler at `0 9 * * *` |

## Architecture

```
client/ (React + Vite + Tailwind)        server/ (Express + TS)
├── api/client.ts  axios + single-flight    ├── auth/jwt.ts        15m access + 7d refresh
│                  refresh interceptor      │                      (rotation + reuse detection)
├── context/AuthContext.tsx                 ├── middleware/         validate (zod) · rate limit · errors
├── components/    RequireRole · AppLayout  ├── models/            User · Job · Application · PrepModule
│                  role-scoped nav          ├── services/          eligibility · analytics (aggregations)
├── pages/         student/ coordinator/    │                      prepTracker · storage (Cloudinary)
│                  admin/                   ├── queue/emailQueue.ts Bull worker (concurrency 5, retries)
└── types/         shared DTOs              ├── cron/reminders.ts  7/3/1-day tiered reminders
                                            └── routes/           /auth /jobs /applications /prep /admin
```

### Auth & token flow

- Login/register return a **15-minute access token** (kept in memory) and set a **7-day httpOnly refresh cookie** scoped to `/api/v1/auth`.
- On expiry the API replies `403 { code: 'TOKEN_EXPIRED' }`; the axios interceptor calls `POST /auth/refresh` (single-flight) and **retries the original request** transparently.
- Refresh tokens are **rotated on every use**; presenting a rotated-out token revokes the session (theft detection).

### Eligibility engine

`GET /jobs` for students pushes eligibility into the Mongo query itself —
`eligibility.minCgpa ≤ student.cgpa`, `eligibility.maxBacklogs ≥ student.backlogs`, `eligibility.departments ∈ student.department`, plus batch and deadline checks — so students only ever see drives they can apply to. The same rules re-run server-side at apply time.

### Deadline reminders

`node-cron` fires at 9:00 daily, finds open jobs with deadlines exactly **7 / 3 / 1 day(s)** out, resolves eligible students who haven't applied, and enqueues templated emails on the Bull queue (3 retries, exponential backoff, concurrency 5). Coordinators can also trigger reminders per job immediately.

### Analytics

Department-wise offers, pipeline status, monthly trends and top companies — all single-round-trip pipelines (`$lookup` → `$unwind` → `$group` → `$sort` → `$project` with `$round`/`$size`), no N+1 queries.

## Quick Start

**Prerequisites:** Node 18+. A MongoDB server — no install needed for local dev (see below); or a free [Atlas](https://www.mongodb.com/atlas) cluster.

```bash
# 1. Install everything (root + server + client)
npm run install:all

# 2. One-time: set up a local MongoDB from a cached/downloaded binary
npm run mongo:setup

# 3. Configure the server
cp server/.env.example server/.env
#    → MONGODB_URI defaults to mongodb://127.0.0.1:27017/campusconnect

# 4. Seed demo data (wipes the DB!)
npm run seed

# 5. Run everything — MongoDB + API + client in one command
npm run dev
```

> Already have MongoDB (local service or Atlas)? Skip steps 2 and let `npm run dev` handle the rest — or point `MONGODB_URI` at your cluster.

Open **http://localhost:5173** and use one of the quick-fill demo buttons, or log in manually:

| Role        | Email                       | Password      |
| ----------- | --------------------------- | ------------- |
| Admin       | `admin@campus.edu`          | `Admin@123`   |
| Coordinator | `coordinator@campus.edu`    | `Coord@123`   |
| Student     | `aarav.student@campus.edu`  | `Student@123` |

> The seed creates 12 students (varied CGPA/backlogs/departments), 8 jobs (7 open with staggered deadlines — several land 1/3/7 days out so the reminder cron has targets — and 1 closed), 22 applications across all six statuses, and 5 prep modules.

**Optional integrations** (all degrade gracefully when unset): `REDIS_URL` enables the Bull queue, `CLOUDINARY_*` enables CDN resume uploads (otherwise resumes land in `server/uploads`), and `SMTP_*` enables real emails (otherwise sends are logged to the console — check the server output after applying or triggering a reminder).

## Scripts

| Where  | Script             | What it does                                  |
| ------ | ------------------ | --------------------------------------------- |
| root   | `npm run dev`      | API + client concurrently                     |
| root   | `npm run seed`     | Reset & reseed demo data                      |
| root   | `npm run build`    | Compile server (tsc) + bundle client (vite)   |
| root   | `npm run smoke`    | E2E API test suite against in-memory MongoDB  |
| server | `npm run typecheck`| Strict TS check                               |

## API Overview (`/api/v1`)

| Area          | Endpoints |
| ------------- | --------- |
| Auth          | `POST /auth/register` (students) · `POST /auth/login` · `POST /auth/refresh` (rotates) · `POST /auth/logout` · `GET /auth/me` |
| Jobs          | `GET /jobs` (role-aware, eligibility-filtered, paginated, `$text` search) · `GET /jobs/:id` · `POST /jobs` · `PATCH /jobs/:id` · `DELETE /jobs/:id` · `GET /jobs/:id/applicants` · `POST /jobs/:id/apply` (multipart resume) · `POST /jobs/:id/remind` |
| Applications  | `GET /applications/me` · `GET /applications` · `PATCH /applications/:id/status` · `DELETE /applications/:id` (withdraw) |
| Prep          | `GET /prep` (modules + overall % + streak) · `POST /prep` · `PATCH /prep/:id` · `DELETE /prep/:id` · `POST /prep/:id/subtopics` · `PATCH /prep/:moduleId/subtopics/:subtopicIndex` · `DELETE /prep/:id/subtopics/:subtopicIndex` |
| Admin         | `GET /admin/analytics` · `GET/PATCH/DELETE /admin/users/:id` · `POST /admin/users/bulk-verify` · `GET /admin/moderation/jobs` · `GET /admin/moderation/applications` |
| Profile       | `PATCH /profile` · `POST /profile/change-password` |

All responses use `{ status, data, meta? }`; errors use `{ status: 'error', error, code }`.

## Production Notes

- Secrets (`ACCESS_SECRET`, `REFRESH_SECRET`, `MONGODB_URI`) are **required** when `NODE_ENV=production` — the server refuses to boot otherwise.
- `npm run build` then `node server/dist/index.js` serves the built SPA from `client/dist` on the same origin (SPA fallback included).
- Refresh cookies flip to `secure` in production; Helmet, CORS allow-list and rate limiting are on by default.
- Deleting a job/user cascades applications; deleting the last admin is blocked; admins cannot demote/deactivate themselves.

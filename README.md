# Domus

Mobile-first PWA for university housing staff — residents, vacancies, incidents, room inspections, and programs/calendar across role-based dashboards.

## Roles

| Role | Scope |
|------|--------|
| **RA** | Section residents, vacancies, incidents, inspections, programs |
| **GA** (Area Director) | Community staff, residents, inspections, incidents, programs |
| **SA** | Community residents (read-only), own incidents, programs |
| **Admin** | All communities, staff, structure, bulk residents, program approvals |

## Stack

- **Frontend:** Next.js 16, React, Tailwind 4, shadcn/ui
- **Backend:** Express, MongoDB (Mongoose) — see [`server/`](server/)
- **PWA:** `next-pwa`, installable with maroon brand theme

## Getting started

Install dependencies and run the Next.js app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The API server runs separately (required for auth and data):

```bash
cd server
npm install
npm run dev
```

Configure MongoDB and JWT in the `server/` environment.

## Project layout

- `app/` — App Router pages per role (`/ra`, `/ga`, `/sa`, `/admin`)
- `components/` — Shared UI (housing, programs, role shells)
- `server/src/` — Express API mounted at `/api`
- `app/dev/` — Local-only debug pages (404 in production)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

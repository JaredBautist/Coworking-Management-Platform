# Coworking Management Platform

A multi-tenant SaaS for managing coworking reservations and utilization, built for
**hybrid teams that share physical workspace across companies**. Book desks and
meeting rooms, see every company's bookings in real time to avoid clashes, and
track utilization — all in a fast, accessible single-page app.

> **Assessment note:** This is a 72-hour prototype. The focus is on product
> thinking, prioritization, and AI-assisted execution — not production polish.

---

## 🔗 Live demo

- **App:** https://coworking-management-platform.vercel.app
- **Repository:** https://github.com/JaredBautist/Coworking-Management-Platform

### Try it in 2 minutes
1. Open the app and **Sign up** — you become an **Office Manager** with a fresh
   organization (this also runs the 2-step onboarding: name your org + create
   your first space).
2. Create a space, then **book** it from *Find Spaces* or the *Calendar*.
3. To see the **cross-company coordination**, sign up a **second account** (a
   different company). Both accounts see each other's reservations in the
   Calendar and *Find Spaces* — that's the core value.

> Suggested demo accounts (create ahead of the demo):
> `manager-a@demo.com` (Company A) and `manager-b@demo.com` (Company B).

---

## 🎯 Problem & who it's for

- **Who:** the **Office Manager** of a company that works out of a shared
  coworking building.
- **Problem:** hybrid teams and multiple companies share the same rooms and
  desks. Without visibility into everyone's bookings, they **double-book and
  clash**.
- **Solution:** a shared booking + availability layer where every company can
  see all reservations (who, what space, when) to coordinate, plus reporting and
  team management from the Office Manager's perspective.

---

## ✨ Features

- **Workspace booking** — search available spaces by date, time and type; book in
  one click from *Find Spaces* or directly on the *Calendar* (editable start/end
  times).
- **Availability & conflict prevention** — exact overlap detection in the client,
  backed by a Postgres `EXCLUDE` constraint so two confirmed bookings can never
  share a space + time slot (even across companies).
- **Shared visibility, private booking** — every company **sees** all
  reservations across the coworking (realtime) to coordinate and avoid clashes,
  but each company **books and manages only its own spaces**.
- **Calendar** — FullCalendar day/week/month views; own vs. other bookings are
  color-coded; business hours (08:00–20:00) highlighted; click a day to see all
  reservations that day before booking.
- **Find Spaces (coordination view)** — one click lists **all bookings across
  companies**; date, time and type are optional filters.
- **Space management** — create, edit, **deactivate** (auto-cancels future
  bookings) and **delete** spaces (Office Manager only).
- **Team & invitations** — paginated member list, role management with
  last-admin and self-demote protection, and **email invitations** (invitees join
  the existing org on signup instead of creating a new one).
- **Meeting attendees** — invite org members to a reservation; they can see the
  meeting.
- **Reporting** — utilization table (from a `space_utilization` view), occupancy
  chart, 30-day daily-reservation trend, and **CSV export**.
- **Utilization forecast (stretch goal)** — a 7-day projection using a
  weekday-seasonal average + linear trend, with a trend indicator.
- **Google Calendar integration** — "Add to Google Calendar" deep links and
  `.ics` export on every reservation (no OAuth required).
- **Auth & security** — Supabase Auth (email/password), 5-attempt lockout,
  60-minute inactivity timeout, route guards, and Row Level Security on every
  table.
- **Polish** — dark mode (light/dark/system), skeleton loaders, toasts, empty
  states, English/Spanish i18n, responsive layout.

---

## 🧱 Tech stack

| Layer | Technology | Why |
|---|---|---|
| Framework | React 19 + TypeScript | Mature ecosystem, strict typing |
| Build | Vite 8 | Instant HMR, code splitting |
| Styling | Tailwind CSS 3 + design tokens | Utility-first, dark mode via CSS vars |
| Routing | React Router 6 | Nested layouts, route guards |
| Server state | TanStack Query 5 | Cache, invalidation, realtime sync |
| Client state | Zustand | Tiny, no boilerplate (auth/UI/theme/lang) |
| Forms | React Hook Form + Zod | Typed validation, minimal re-renders |
| Calendar | FullCalendar 6 | Day/week/month out of the box |
| Backend | Supabase (Auth, Postgres, Realtime, RLS) | Fast to ship, auth + security built in |
| Testing | Vitest + Testing Library + fast-check | Property-based testing |
| Hosting | Vercel (SPA) | Zero-config Vite deploys |

---

## 🚀 Getting started

### Prerequisites
- Node.js 20+
- A Supabase project (free tier is fine)

### Setup
1. Clone and install:
   ```bash
   git clone https://github.com/JaredBautist/Coworking-Management-Platform.git
   cd Coworking-Management-Platform
   npm install
   ```
2. Create a `.env` in the project root:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   (Both values are in your Supabase project under **Project Settings → API**.)
3. In the Supabase **SQL Editor**, paste and run the full **`supabase-schema.sql`**.
   It creates tables, the utilization view, RLS policies, and the signup trigger.
4. Start the dev server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`.

### Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview the production build |
| `npm run test:run` | Run the test suite once |
| `npm run test` | Run tests in watch mode |
| `npm run lint` | Lint with oxlint |
| `npm run typecheck` | Type-check without emitting |

---

## 🗄️ Database

Run **`supabase-schema.sql`** (idempotent, drops & recreates cleanly). It provisions:

| Object | Purpose |
|---|---|
| `organizations` | One row per company (tenant) |
| `profiles` | User profile linked to `auth.users` (role, org) |
| `spaces` | Desks, meeting rooms, phone booths, event spaces |
| `reservations` | Bookings, with an `EXCLUDE` constraint preventing overlaps |
| `invitations` | Pending email invites; the signup trigger joins invitees to the org |
| `reservation_attendees` | Members invited to a specific meeting |
| `space_utilization` (view) | Aggregated utilization over the last 30 days |

Plus: RLS policies on every table (shared-read for coworking coordination,
scoped writes), `SECURITY DEFINER` helper functions with a fixed `search_path`,
and a `handle_new_user` trigger that creates the org/profile (or joins an invited
one) on signup.

---

## ☁️ Deployment (Vercel)

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new). Vercel
   auto-detects Vite (config is in `vercel.json`, including the SPA rewrite so
   deep links don't 404).
2. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. Deploy. In **Supabase → Authentication → URL Configuration**, set the
   **Site URL** and add **Redirect URLs** for your Vercel domain so email
   confirmation and password reset redirect correctly.

---

## 🏛️ Architecture

Feature-based structure; server state via TanStack Query, client/UI state via
Zustand, security enforced by Supabase RLS.

```
src/
├── app/            # Router (guards, lazy routes) + providers
├── components/
│   ├── ui/         # Reusable primitives (Button, Card, Table, Dialog, …)
│   ├── layout/     # AppShell, Sidebar, TopBar
│   └── shared/     # Toast, ConfirmDialog, ErrorBoundary, AddToCalendar, skeletons
├── features/       # auth, onboarding, dashboard, spaces, reservations,
│                   # calendar, reports, team  (each: Page + hooks + schemas)
├── hooks/          # useAuth, useRole, useTheme, useDebounce, useInactivityTimeout
├── lib/            # supabase client, realtime, i18n, forecast, calendar-export
├── stores/         # Zustand: auth, ui, theme, language
├── test/           # Property tests (fast-check)
└── types/          # Shared TypeScript types
```

**Key decisions & tradeoffs**
- **Supabase as BaaS** to maximize speed/security in 72h (auth, DB, realtime, RLS
  out of the box) — at the cost of vendor lock-in.
- **Shared reservation visibility, private space ownership** — companies see all
  bookings to coordinate but only book/manage their own spaces; the cost is
  exposing some booking data (names) across companies via relaxed read RLS.
- **Google Calendar via `.ics` + deep link** instead of full OAuth — 80% of the
  value with none of the setup friction.
- **Statistical forecast** (weekday pattern + trend) instead of heavy ML —
  explainable and enough for a prototype.

---

## ✅ Testing

Property-based tests with **fast-check** cover overlap detection, validation,
occupancy math, pagination, role rules and more.

```bash
npm run test:run   # 35/35 passing (deterministic)
```

---

## 🛠️ Built with

Spec-driven development in the **Kiro** IDE (requirements → design → tasks), then
implemented with **Claude Code (Opus 4.8)** as the primary coding agent.

## 📄 License

GNU General Public License v3.0

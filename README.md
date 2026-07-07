# Coworking Management Platform

A modern single-page application for managing coworking spaces, reservations, and teams. Built with React, TypeScript, and Supabase.

## Features

- **Workspace Booking** — Search available spaces by date, time, and type; book with one click
- **Calendar View** — FullCalendar integration with day/week/month views; click to create reservations directly on the calendar
- **Space Management** — Create, edit, and deactivate spaces (office manager only)
- **Reservations** — View upcoming and past reservations; cancel with confirmation
- **Reporting** — Utilization tables, occupancy charts, daily reservation trends, CSV export
- **Team Management** — Manage members and roles; role-based access control with self-demote protection
- **Real-time Updates** — Supabase Realtime keeps the UI in sync across sessions
- **Multi-language** — English and Spanish UI
- **Responsive Design** — Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19, TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| State | Zustand (client state), TanStack Query 5 (server state) |
| Forms | React Hook Form + Zod |
| Calendar | FullCalendar 6 |
| Charts | Recharts |
| Backend | Supabase (Auth, Database, Realtime, RLS) |
| Testing | Vitest, Testing Library, fast-check |

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project

### Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor
5. Start the dev server:
   ```bash
   npm run dev
   ```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once |
| `npm run lint` | Lint codebase |
| `npm run typecheck` | Type-check without emitting |

## Database Schema

Run `supabase-schema.sql` in your Supabase SQL Editor. The schema includes:

- `organizations` — Multi-tenant organization table
- `profiles` — Extended user profiles linked to `auth.users`
- `spaces` — Coworking spaces (desks, meeting rooms, booths, event spaces)
- `reservations` — Bookings with overlap prevention via exclusion constraint
- `space_utilization` — View for reporting (last 30 days)
- Row Level Security policies for all tables
- Auto-profile creation trigger on signup

## Architecture

```
src/
├── app/           # Router, providers
├── components/    # Shared UI (layout, skeletons, dialogs, toasts)
├── features/      # Feature modules (auth, spaces, reservations, calendar, reports, team, dashboard)
├── hooks/         # Global hooks (useAuth, useRole, useDebounce)
├── lib/           # Supabase client, i18n, query client
├── stores/        # Zustand stores (auth, UI, language)
├── test/          # Property tests and test setup
└── types/         # Global TypeScript types
```

## License

GNU General Public License v3.0

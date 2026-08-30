# Phour — Project Roadmap

This roadmap is grounded in the current repository. Items are split into phases and marked when implemented or partial.

## Phase 1 — Foundation (Core scaffold)
Completed:
- Authentication (Clerk) — completed
- App Router + global layout — completed
- Dashboard (basic) — completed
- Tasks basic CRUD UI and API endpoints — partially completed (UI + API + repositories present; requires Appwrite configuration)
- Habits basic UI and API — partially completed (UI + API present)
- Focus Timer (client-side) — completed
- Insights (basic computed metrics) — completed

Notes: Server-side repository implementations exist for tasks/habits/focus sessions, but Appwrite environment configuration is required to persist data.

## Phase 2 — Persistence and Reliability
Planned / In progress:
- Appwrite integration and configuration (env vars, create collections) — repository code present; developer must configure Appwrite per `APPWRITE_SCHEMA.md` (required)
- Database schema validation & migrations — planned
- Improve API error shapes and client error handling — partially completed (central client request helper, toast errors, optimistic rollback; API handlers still have inconsistent server error helpers)
- Add local dev fallback or Appwrite mock mode — recommended

## Phase 3 — Productivity features
Planned (not yet implemented):
- Projects & Kanban boards (repositories exist, UI not yet implemented)
- Subtasks persistence (UI exists partially; reconcile with `subtasks` repository)
- Tags, categories, and filtering — planned
- Calendar integration and scheduling features — planned
- Advanced insights and charts — planned (no charting library yet)

## Phase 4 — UX polish
Planned:
- Toast notifications and centralized error UI — completed for current task, habit, and focus-session actions
- Better loading states and skeletons for data fetches — completed for task and habit initial loads
- Accessibility audits and improvements — partially completed (focus visibility and action labels improved; full audit remains)
- Responsive polish across breakpoints — partially completed (task layout and action controls refined)
- Design system extraction and Storybook — planned

## Phase 5 — Quality, Ops, Release
Planned:
- Unit tests for hooks, components, and repositories
- E2E tests for core flows (sign-in, create task, timer)
- CI pipeline (lint, types, tests, build)
- Monitoring and error tracking (Sentry or similar)
- Deployment manifests (Vercel or container/Docker) and release plan

## Suggested milestone timeline (indicative)
- 0–2 weeks: Pin dependencies, add `.env.example`, improve README with Appwrite setup, and add session handoff docs (done: docs created)
- 2–6 weeks: Add tests for `useTasks` and repository logic; add CI.
- 6–12 weeks: Implement subtask persistence, projects UI, search/filtering, and UX polish.
- 3–6 months: Analytics, charts, mobile/PWA considerations, and production readiness.

---

Notes
- The roadmap intentionally mirrors what the codebase already contains. Implement features in the repo-first order (use existing repositories and server routes where possible).
- Prioritize reliability (persistence + CI) before adding large new features.
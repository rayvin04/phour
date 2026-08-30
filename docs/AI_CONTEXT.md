# Phour — AI Context

This file is the permanent memory of the Phour project. It summarizes the current implementation and the decisions that future AI contributors must rely on.

## What is Phour?
Phour is a calm, intentional productivity workspace implemented as a web-first application. The app focuses on tasks, habits, a simple focus timer, and lightweight insights.

## What problem does it solve?
Phour helps users capture tasks and habits, run focused work sessions, and view simple progress metrics in a minimal, distraction-reduced interface.

## Product vision
A premium, minimal productivity workspace that makes it easy to plan work, keep habit momentum, and record focused sessions. The web app is the primary deliverable; mobile support is a possible future phase.

## Design philosophy
- Calm, minimal, and intentional UI.
- Subtle motion and soft visual tokens (rounded corners, soft shadows, pastel accent colors).
- Prioritize clarity and focus over dense feature lists.
- Responsive layout with a sidebar + content shell that collapses on small screens.

## Current technology stack
- Next.js (App Router)
- React (TypeScript)
- Clerk for authentication (`@clerk/nextjs`)
- Appwrite for persistence (server APIs call Appwrite repositories)
- pnpm as package manager
- No external UI library; custom CSS in `src/app/globals.css`

## Key libraries
- `next` (latest in package.json)
- `react` / `react-dom` (latest)
- `@clerk/nextjs` (latest)
- TypeScript and type declarations

## Project structure (important folders)
- `src/app/` — Next.js app-router pages, root layout, global CSS, and API route handlers.
  - `page.tsx` — dashboard (`/`)
  - `sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in route
  - `tasks`, `habits`, `focus-timer`, `insights` — workspace pages
  - `api/` — server route handlers for tasks, habits, focus-sessions, projects, settings
- `src/components/` — UI primitives and the `AppShell` layout
  - `components/ui/*` — `Button`, `Card`, `SectionHeading`
  - `app-shell.tsx` — shared sidebar + content shell
- `src/features/` — feature modules
  - `features/tasks/` — `use-tasks`, UI components, types, validation, and a client-side service wrapper
- `src/lib/` — infrastructure and providers
  - `workspace-provider.tsx` — composes isolated task, habit, and focus-timer providers
  - `appwrite/` — `client.ts`, `config.ts`, `types.ts`, and `repositories/*` implementing Appwrite access
  - `auth/require-user.ts` — server helper enforcing Clerk auth in API handlers
- `src/proxy.ts` — Clerk middleware matcher for the App Router
- Global styles: `src/app/globals.css`

## Authentication
- Clerk (`@clerk/nextjs`) is the auth provider.
- `ClerkProvider` is set in `src/app/layout.tsx` so client components can use `useUser()`.
- Server route handlers call `requireClerkUserId()` which uses `auth()` from `@clerk/nextjs/server` to retrieve the current user ID and throw `Unauthorized` when no session exists.
- `src/proxy.ts` exports `clerkMiddleware()` with a matcher for app routes and `/api/*`.

## State management
- Primary mechanism: feature-scoped React Context providers with React local state.
- `TasksProvider`, `HabitsProvider`, and `FocusTimerProvider` are composed by `WorkspaceProvider` but publish independent contexts. Timer ticks therefore do not re-render task- or habit-only views.
- `useTasks()` manages task state and optimistic API synchronization; task and habit data loads only when a consuming workspace view mounts.
- `ToastProvider` supplies accessible, non-blocking success and error feedback.
- Clerk client state (`useUser()`) is used for personalization and to avoid loading private API data until a user exists; server-side `auth()` is used within API routes.

## Database strategy
- Appwrite is the intended persistent store. The server-side layer (`src/lib/appwrite/*`) implements request helpers and collection repositories that enforce ownership.
- `APPWRITE_*` environment variables are required by `appwrite/config.ts` on the server. The repo includes `APPWRITE_SCHEMA.md` describing collections and attributes.
- During development, missing environment variables will cause server-side errors. There is no local mock mode implemented in code.

## Implemented features
- Authentication shell with Clerk (sign-in UI and UserButton).
- Dashboard (`/`) with greeting and metric cards.
- Tasks UI: listing, toggling, creating, editing, archiving, deleting with optimistic UI, rollback on persistence failure, responsive task rows, and save-on-blur text fields. `useTasks()` and `/api/tasks` endpoints exist.
- Habits UI: listing, creating, toggling with optimistic UI and rollback. Server API routes exist.
- Focus timer: client-side 25-minute Pomodoro-style timer that stops and persists a completed focus session at 25 minutes; resetting a partial timer persists it.
- Simple insights page that aggregates workspace state into metrics.
- Loading skeletons, accessible toast feedback, and keyboard-visible focus treatments for current workspace features.
- Appwrite repository pattern (`UserRepository`) used by server APIs for ownership checks.

## Planned features (explicit in code/docs but not yet complete)
- Durable persistence requires configuring Appwrite (env vars + collections).
- Additional product features (kanban, calendar, advanced insights) are in the roadmap (see PROJECT_ROADMAP.md).

## Technical debt (current)
- Floating dependency versions (`latest`) in `package.json` which risks inconsistent installs.
- No tests, CI, or deployment manifests.
- No central design system package (small UI primitives exist but no Storybook or component docs).
- Subtask persistence is inconsistent: UI keeps subtasks in-memory while a `subtasks` repository exists in server code.
- Optimistic mutations use local snapshots for rollback, but concurrent edits to the same task are not conflict-resolved.
- Focus sessions are written on completion/reset but historical sessions are not loaded into workspace state.

## Architectural decisions already made
- Next.js App Router is the app structure.
- Clerk is the single authentication provider.
- Appwrite is the chosen backend persistence with a server-only API key pattern.
- Repository pattern for Appwrite (`UserRepository`) enforces ownership before write/delete.
- `WorkspaceProvider` composes independent feature contexts instead of exposing one mutable workspace context; this isolates re-renders and enables lazy feature loading.
- Client mutations use optimistic updates and roll back local state when API persistence fails.

## Coding conventions
- TypeScript with React function components and hooks.
- Small reusable primitives in `src/components/ui/` returning minimal wrappers.
- `use client` directives are used on client components where necessary.
- Network calls from client components go to `/api/*` endpoints; server routes handle Appwrite interaction.

## Folder conventions
- `src/app` contains route-based pages and global layout/styles.
- `src/features` contains feature-specific logic, state hooks, types, and UI for that feature.
- `src/components` contains UI primitives and shared layout components.
- `src/lib` contains infrastructure (appwrite client, providers, auth helpers).

## Component conventions
- UI primitives are intentionally minimal and styled via `globals.css`; `ToastProvider` and `Skeleton` are reusable feedback/loading primitives.
- Use `AppShell` for workspace pages to maintain consistent navigation and layout.
- Keep logic in hooks/providers and use focused presentation components (for example, `TaskRow`) for editing UI.

---

Notes
- Update this document only when the architecture or product vision changes significantly.
- This is the canonical context for AI agents contributing to Phour.
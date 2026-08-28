# Phour Architecture Document

Date of inspection: August 28, 2026

This document describes the current state of the project as it exists in this repository and the companion exported prototype in `outputs/focusflow-dashboard.html`. It is intentionally explicit and does not hide gaps, because the codebase is still early and the long-term architect needs a faithful map of what is actually here.

## 1. Project Overview

### Project purpose

Phour is a productivity application intended to help a user plan tasks, track habits, run focus sessions, and review lightweight progress metrics. The current direction is a web-first product built with Next.js and Clerk authentication, with a possible future mobile expansion once the web version stabilizes.

The product has two visible layers in the repository history:

- A standalone HTML prototype in `outputs/focusflow-dashboard.html`.
- A Next.js application scaffold in `focusflow-next/`.

The prototype is significantly richer in UI breadth and interaction depth than the current Next.js scaffold. The Next.js app is the foundation for the actual product, but it still contains only a narrow slice of the intended product surface.

### Current development status

The project is in an early scaffold stage.

What exists now:

- A basic Next.js app router project.
- Clerk authentication wiring.
- A `/sign-in` route.
- A top-level dashboard page with in-memory task state.
- Global styling that establishes the visual direction.

What does not yet exist:

- No database.
- No real persistence.
- No API routes.
- No server actions.
- No task creation tied to storage.
- No habit storage.
- No focus-session persistence.
- No analytics pipeline.
- No mobile app.
- No shared design system package.

### Main features currently implemented

- Authentication shell with Clerk.
- Signed-in vs signed-out header controls.
- A dashboard greeting that reads user identity from Clerk when available.
- A simple task list with checkbox toggles.
- A client-side “add task” form that appends to local React state.
- Responsive two-column layout that collapses to a single column on small screens.
- A sign-in page using Clerk’s `<SignIn />` component.

### Features partially implemented

- Task creation exists only in client memory.
- Task completion exists only in client memory.
- User-specific personalization exists only at render time through Clerk state; no user profile records are stored by the app itself.
- The dashboard UI exists, but only as a minimal slice of the prototype experience.
- Authentication is wired, but the app does not yet use roles, metadata, or protected routes beyond the basic Clerk middleware scaffold.

### Features broken or unfinished

- Nothing persists after refresh.
- There is no task deletion.
- There is no editing flow for tasks.
- There is no habit system in the Next.js app.
- There is no focus timer in the Next.js app.
- There is no insights or reporting section in the Next.js app.
- There is no dashboard state synchronization between users or devices.
- There is no actual backend.
- There is no user settings screen.
- There is no onboarding or account setup flow beyond Clerk sign-in.
- There is no project-level validation, error handling, or loading-state architecture.

### Known limitations

- The app depends entirely on browser memory for task state.
- Clerk environment keys are required for runtime behavior.
- The project uses `latest` versions in `package.json`, so dependency resolution is intentionally floating rather than pinned.
- The visual design is intentionally simple, but not yet complete.
- The file structure is small enough that there is no meaningful modular separation yet.
- The prototype HTML file and the Next.js app are not integrated; they are separate artifacts.

## 2. Tech Stack

### Frameworks

- Next.js
  - Why it exists: it is the application framework for routing, server/client rendering, and the app router structure.
  - Current role: primary web application framework.

- React
  - Why it exists: component model and state management in the UI.
  - Current role: all visible app UI is React-based.

### Runtime

- Node.js
  - Why it exists: Next.js runs on Node for development and production server execution.
  - Current role: build/runtime host for the web app.

### Package manager

- pnpm
  - Why it exists: it is the package manager used by the scaffold and lockfile.
  - Current role: installs dependencies and runs scripts.

### Authentication

- Clerk (`@clerk/nextjs`)
  - Why it exists: user sign-in, sign-up, session management, and the profile/user button UI.
  - Current role: the only authentication provider.

### Database

- None
  - Why it exists: there is no database dependency yet.
  - Current role: not applicable.

### ORM

- None
  - Why it exists: there is no persistence layer.
  - Current role: not applicable.

### API architecture

- None yet
  - Why it exists: there are no `app/api/*` routes or equivalent handlers.
  - Current role: not implemented.

### Validation library

- None
  - Why it exists: no shared validation system has been added.
  - Current role: not implemented.

### State management

- React local state
  - Why it exists: task list and draft input are managed with `useState`.
  - Current role: only state mechanism in the app.

- React derived state
  - Why it exists: `useMemo` is used to derive the completed-task count.
  - Current role: lightweight computed state.

- Clerk user/session state
  - Why it exists: the app reads the current signed-in user from Clerk.
  - Current role: personalization and auth controls.

### Caching

- None
  - Why it exists: there is no server data fetch layer that needs caching.
  - Current role: not implemented.

### Storage

- Browser memory only
  - Why it exists: tasks live in React state.
  - Current role: ephemeral runtime storage.

- No durable app storage
  - Why it exists: no database or IndexedDB/localStorage implementation exists in the Next.js app.

### File uploads

- None
  - Why it exists: there is no upload UI or backend.

### UI library

- None
  - Why it exists: the UI is custom HTML/CSS and React components, with no component library.

### Animation library

- None
  - Why it exists: no motion dependency is installed.
  - Current role: CSS-only static presentation.

### Icons

- None
  - Why it exists: there is no icon package in `package.json`.

### Charts

- None
  - Why it exists: no charting library is installed.

### Date library

- None
  - Why it exists: dates are rendered directly or hard-coded.

### Deployment platform

- None configured
  - Why it exists: there is no `vercel.json`, Dockerfile, or deployment manifest in the repo.

### Environment variables

- Clerk public and secret keys
  - Why it exists: Clerk requires runtime auth configuration.
  - Current role: authenticates the app and connects it to the Clerk project.

- Clerk route URLs
  - Why it exists: the app needs sign-in redirect configuration.

### Linting

- ESLint
  - Why it exists: linting is set up through Next.js defaults.

- `eslint-config-next`
  - Why it exists: Next.js-specific lint rules and conventions.

### Formatting

- None explicitly configured
  - Why it exists: there is no Prettier config or formatting tool in the files currently present.

### Testing

- None
  - Why it exists: there are no test files or test runner scripts.

### CI/CD

- None
  - Why it exists: there is no GitHub Actions or similar pipeline configuration.

### Analytics

- None
  - Why it exists: no analytics provider or event instrumentation is present.

### Logging

- Console/runtime logging only
  - Why it exists: development logging comes from Next.js and Clerk.

### Error monitoring

- None
  - Why it exists: no Sentry or equivalent monitoring is configured.

### Email service

- None
  - Why it exists: no email provider is installed.

### Notifications

- None
  - Why it exists: there is no notifications subsystem.

### Anything else installed

- TypeScript
  - Why it exists: type checking for the React and Next.js codebase.

- React DOM
  - Why it exists: browser rendering target for React.

- `@types/node`
  - Why it exists: TypeScript types for Node.js APIs used by Next.js tooling.

- `@types/react`
  - Why it exists: TypeScript types for React components and hooks.

- `@types/react-dom`
  - Why it exists: TypeScript types for React DOM rendering APIs.

## 3. Folder Structure

### Important folder tree

```text
focusflow-next/
├─ AGENTS.md
├─ CLAUDE.md
├─ README.md
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ tsconfig.json
├─ next-env.d.ts
└─ src/
   ├─ proxy.ts
   └─ app/
      ├─ layout.tsx
      ├─ globals.css
      ├─ page.tsx
      ├─ auth-controls.tsx
      └─ sign-in/
         └─ [[...sign-in]]/
            └─ page.tsx
```

### What each major folder does

- `src/app/`
  - The app router directory. This contains the root layout, the dashboard page, the Clerk sign-in route, and global CSS.

- `src/app/sign-in/[[...sign-in]]/`
  - The catch-all Clerk sign-in route segment. It allows Clerk’s sign-in flow to handle nested route states inside the `/sign-in` path.

- `src/app/auth-controls.tsx`
  - Client component that switches between Clerk sign-in/sign-up buttons and the signed-in user button.

- `src/proxy.ts`
  - Clerk middleware proxy for route protection and auth-aware request handling in the app-router environment.

- `outputs/`
  - Exported artifacts from the earlier standalone prototype.

### Architecture pattern being followed

The project is following a simple App Router + client-state scaffold pattern:

- A single global layout wraps the app.
- Authentication is layered in through Clerk provider context.
- The main dashboard is a client component holding local state.
- Styling is handled through one global CSS file.

This is not yet a domain-driven architecture, not yet a feature-sliced architecture, and not yet a layered backend/frontend architecture. It is a minimal starter that will need deliberate decomposition as features grow.

## 4. Routing

### Public routes

- `/`
  - Main dashboard page.
  - Current behavior: shows the app shell, auth-aware header, greeting, metrics, and local task list.

- `/sign-in`
  - Clerk sign-in route.
  - Current behavior: renders `<SignIn />` in a simple auth page wrapper.

### Protected routes

- No route is explicitly protected in app code right now.
- Clerk middleware is present, but there is no route-level authorization logic for a private dashboard versus public landing page split.
- The dashboard content is effectively accessible to anyone who loads `/`, though the displayed user name and top-right auth control depend on Clerk state.

### Admin routes

- None.

### API routes

- None.

### Dynamic routes

- `/sign-in/[[...sign-in]]`
  - Catch-all route used by Clerk for sign-in states.

### Authentication flow

1. User visits `/`.
2. `ClerkProvider` in `src/app/layout.tsx` initializes Clerk on the client.
3. `AuthControls` reads session state with `useUser()`.
4. If signed out, the header shows Clerk sign-in and sign-up buttons.
5. If signed in, the header shows Clerk’s `UserButton`.
6. The dashboard page also reads the user object and uses the first name, full name, or primary email address as the greeting name.
7. If the user opens `/sign-in`, Clerk renders its sign-in UI with Google or other enabled strategies.

## 5. Authentication

### How Clerk is configured

Clerk is installed through `@clerk/nextjs` and wrapped globally in `ClerkProvider` from `src/app/layout.tsx`.

Configuration is expected through environment variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`

The `README.md` also references Clerk CLI commands for login, app initialization, and diagnostics.

### Middleware

`src/proxy.ts` uses `clerkMiddleware()` from `@clerk/nextjs/server`.

It applies a matcher that excludes common static asset extensions and includes:

- app routes
- API routes
- `/__clerk/:path*`

This is the routing/auth layer Clerk expects in the app-router setup.

### Protected routes

There is no fine-grained authorization policy yet.

What exists is only the Clerk middleware scaffold. The app does not currently enforce:

- signed-in-only pages
- role-based routes
- workspace membership
- account ownership checks

### Session handling

Session handling is delegated entirely to Clerk.

The app reads user state in client components with `useUser()`. There is no custom session store, no cookies manipulation in app code, and no server-side session hydration strategy beyond what Clerk provides.

### User metadata

No custom user metadata is read or written by the app.

The dashboard greeting uses built-in Clerk user fields:

- `firstName`
- `fullName`
- primary email address

### Roles

No role model exists.

### Permissions

No permission model exists.

### Authorization

Authorization is effectively “Clerk-authenticated user context exists or it doesn’t.”

There is no app-owned authorization logic yet.

## 6. Database

There is no database in the repository.

### Tables

None.

### Schema

None.

### Current problems caused by no database

- Tasks do not persist.
- User-specific settings do not persist.
- Habit completion does not persist.
- Focus timer history does not persist.
- There is no audit trail.
- There is no multi-device sync.

### Future concerns

When a database is introduced, the system will need a stable owner model. Likely future entities include:

- users
- tasks
- habits
- focus sessions
- tags or labels
- preferences
- notifications
- possibly team/workspace entities if collaboration is added

## 7. Data Flow

### Current flow for task creation and completion

```text
User action
  ↓
Dashboard UI in `page.tsx`
  ↓
React local state (`tasks`, `draft`)
  ↓
No API layer
  ↓
No database
  ↓
State updates in memory
  ↓
Re-render of the same client component
```

### Current flow for auth-aware header rendering

```text
User action
  ↓
Clerk session state changes
  ↓
`useUser()` updates in client components
  ↓
`AuthControls` switches UI branch
  ↓
Header re-renders
```

### Current flow for sign-in

```text
User action
  ↓
Visit `/sign-in`
  ↓
Clerk `<SignIn />`
  ↓
Clerk hosted auth/session flow
  ↓
Client session becomes available
  ↓
Dashboard and header personalize
```

### Data flow diagram

```text
Task input
  → React state
  → derived counts
  → render

Auth state
  → Clerk session
  → useUser()
  → conditional header/dashboard name
```

## 8. State Management

### Local state

The dashboard uses `useState` for:

- task list
- draft task input

This is appropriate for the current scope, but it is purely ephemeral.

### Global state

No global state manager exists.

### Server state

No server state manager exists.

### React Query

Not used.

### Context

Only Clerk’s provider context is used.

### Redux

Not used.

### Zustand

Not used.

### Why each is used

- React state is used because the app is too small to justify more machinery.
- Clerk context is used because authentication state must be shared across UI components.

### Assessment

This is acceptable for a prototype, but not for a real productivity app with persistence, syncing, and offline behavior.

## 9. API

There are no app-owned API endpoints.

### Endpoints that exist in practice

- Clerk-managed authentication endpoints
  - Purpose: sign-in, sign-up, session lifecycle, user management.
  - Request/response shape: managed by Clerk.
  - Validation: managed by Clerk.
  - Authentication: built in.
  - Error handling: built in to Clerk UI/runtime.

### Endpoints that do not exist yet

- No `/api/tasks`
- No `/api/habits`
- No `/api/focus-sessions`
- No `/api/users`
- No `/api/settings`

## 10. Components

### Component hierarchy

- `RootLayout` in `src/app/layout.tsx`
  - wraps the whole app
  - injects Clerk
  - renders header
  - renders page content

- `AuthControls` in `src/app/auth-controls.tsx`
  - reads auth state
  - chooses which top-right controls to show

- `Home` in `src/app/page.tsx`
  - dashboard page
  - owns local task state
  - reads Clerk user state

- `SignIn` page in `src/app/sign-in/[[...sign-in]]/page.tsx`
  - renders Clerk auth UI

### Shared components

- None yet in a reusable design-system sense.

### Reusable UI

- `AuthControls` is the first small reusable auth component.

### Layout components

- `RootLayout`

### Providers

- `ClerkProvider`

### Hooks

- `useUser`
- `useState`
- `useMemo`

### Utilities

- None beyond simple inline helper logic.

## 11. Design System

### Typography

The current app uses a system font stack centered on:

- `"Segoe UI"`
- `Inter`
- `system-ui`

The prototype and app both use aggressive negative letter spacing in headlines to create a slightly premium, compact feel.

### Spacing

Spacing is based on:

- large page padding with `clamp()`
- 16px/18px/20px card gaps
- rounded internal input/button spacing

The design is functional but not yet encoded as a formal spacing scale.

### Grid

- Desktop: two-column app shell in the Next.js app, three-column summary grids in the prototype.
- Mobile: collapses to a single column.

### Breakpoints

The CSS currently uses:

- `max-width: 760px`
- `max-width: 480px`
- in the prototype, `max-width: 800px`

### Colors

Primary palette:

- ink: `#202232`
- muted text: `#74778a`
- line/border: `#e8e8ef`
- canvas: `#f7f7fc`
- white paper: `#fff`
- accent purple: `#6756db`

The palette is restrained and calm.

### Tailwind configuration

None.

### Component variants

There is no formal variant system. Button styles are encoded directly in CSS class names.

### Shadows

Very light shadows are used in the prototype. The Next.js app currently emphasizes flat cards with borders more than depth.

### Border radius

Mostly 10px to 16px in the current design.

### Motion

Minimal motion only.

### Dark mode

Not implemented.

### Icons

None.

### Current design philosophy

The current look is a restrained productivity dashboard:

- calm
- neutral
- lightly premium
- simple enough to understand instantly

It does not yet have a fully articulated brand language.

## 12. Current Problems

### Duplicated code

- The prototype HTML and the Next.js app duplicate visual ideas and some layout logic.

Why this is a problem:

- It splits evolution effort across two artifacts.
- Changes to one version do not automatically inform the other.

### Poor folder organization

- The project is so small that all app logic lives in just a few files.

Why this is a problem:

- The next feature will force a much larger refactor if the code is not decomposed soon.

### Massive components

- `src/app/page.tsx` is doing too much for one component: auth-aware rendering, local state, metrics, and form handling.

Why this is a problem:

- It will become difficult to test, reuse, and extend.

### Dead code

- None obvious in the Next.js app.
- The standalone HTML artifact may now be functionally obsolete if the Next.js app becomes the canonical product.

Why this is a problem:

- Duplicate source of truth leads to drift.

### Unused packages

- There are currently no clearly unused packages in `package.json` because the dependency list is very small.

### Inconsistent naming

- The brand appears as both `focusflow` and `focusflow-next`.
- Some text refers to “Today,” “Tasks,” and “Focus timer” without a shared schema.

Why this is a problem:

- It hints that product terminology is not yet standardized.

### Performance issues

- Not a bottleneck today.
- The biggest future risk is unnecessary client-side rendering once data becomes server-backed.

### Accessibility issues

- The current controls are visually understandable, but there is little dedicated accessibility engineering.
- The sign-in and task affordances are basic, and there is no documented keyboard interaction model beyond default HTML behavior.

### Security concerns

- No app-owned backend yet means limited attack surface, but also no authorization enforcement.
- Environment key management is sensitive.

### Race conditions

- None obvious with the current local state.
- Future async persistence will introduce this risk.

### Memory leaks

- None obvious.

### Hydration issues

- The app previously encountered hydration noise from browser extensions and server/client mismatch symptoms during Clerk integration.

Why this is a problem:

- It complicates debugging and can make real SSR issues harder to spot.

### React anti-patterns

- The dashboard component uses inline event handlers and inline derived UI in a single file.

Why this is a problem:

- It is tolerable now but becomes brittle as complexity grows.

### Server/client issues

- The page is currently a client component because it uses Clerk and local state.

Why this is a problem:

- It means all dashboard rendering is client-side, which is fine for now but not ideal for performance or SEO long-term.

### Slow rendering

- Not currently a major issue.

### Bad UX

- No persistence.
- No editing.
- No deletion.
- No real feedback states.
- No empty state strategy beyond the initial seed tasks.

### Technical debt

- The app currently stores important product direction in ad hoc CSS and a single dashboard component.

Why this is a problem:

- The code is easy to move quickly through now, but hard to evolve cleanly later.

## 13. Feature Audit

### Working correctly

- Clerk sign-in route exists.
- Clerk provider is mounted.
- Signed-in user data can be read.
- Header can switch between auth states.
- Task completion toggling works in-memory.
- Add-task form works in-memory.
- Dashboard responds to small-screen layouts.

### Partially working

- Personalized greeting works only while Clerk session state is available.
- Task list works only for the current browser session.
- Header authentication UI works, but it does not own any custom app profile logic.

### Broken

- Persistent task storage.
- Real user account setup inside the app.
- Mobile app.
- Database-backed features.

### Missing edge cases

- Empty task list state after deleting all tasks.
- Duplicate task titles.
- Long titles.
- Invalid or whitespace-only submission beyond the simple trim guard.
- Loading and error states for auth.

### Needs redesign

- The dashboard should be split into domain components.
- The current page should be reorganized into feature modules once data persistence exists.

## 14. Performance Audit

### Bundle size

- Currently small.
- Risk grows as more client-side features are added.

### Rendering

- Mostly client-side rendering for the dashboard because the page is a client component.

### Memoization

- `useMemo` is used for completed-task count.
- This is fine, but not especially meaningful at the current data size.

### Database queries

- None.

### API performance

- None to analyze yet.

### Loading strategy

- Clerk is loaded through provider context.
- The app does not yet have skeletons or streaming strategies.

### Image optimization

- Not applicable.

### Caching

- None.

### Lazy loading

- None meaningful.

### Server Components

- Not meaningfully used on the dashboard page because it is a client component.

### Client Components

- Auth controls and dashboard are client components.

Performance verdict:

- Adequate for a prototype.
- Not yet architected for a data-heavy production app.

## 15. UI/UX Audit

Ratings are from 1 to 10.

- Hierarchy: 7
- Alignment: 7
- Spacing: 6
- Visual consistency: 7
- Accessibility: 5
- Navigation: 6
- Interaction quality: 5
- Animations: 3
- Feedback: 4
- Empty states: 3
- Loading states: 2
- Error states: 2
- Typography: 7
- Contrast: 7
- Consistency: 6
- Overall polish: 6

### Critique

The UI is clean and readable, but it is still closer to a polished prototype than a complete product.

Strengths:

- Calm visual language.
- Good spacing relative to the complexity of the current app.
- Responsive behavior is present.
- Cards are easy to scan.

Weaknesses:

- No meaningful state feedback.
- No rich interaction patterns.
- No productive use of motion or progressive disclosure.
- The page lacks a premium system-level feel.
- The UI is functional, but not yet emotionally distinctive.

## 16. Design Language Recommendation

Recommended direction: a calm editorial productivity system with soft glass-free elevation, warm neutrals, and a restrained indigo accent.

### Overall visual philosophy

- Quiet confidence.
- Strong structure.
- Minimal ornament.
- A premium notebook-meets-command-center feel.
- Fast to scan, easy to trust.

### Color system

- Background: warm off-white or pale slate.
- Surface: pure white or slightly tinted white.
- Primary accent: indigo / blue-violet.
- Success: muted green.
- Warning: amber used sparingly.
- Text: deep slate rather than pure black.
- Borders: subtle cool gray.

### Typography pairing

- Primary: a modern grotesk or system-like sans with strong legibility.
- Secondary: same family, different weights, rather than mixing too many typefaces.

### Spacing scale

- Base scale should be 4px or 8px.
- Use large section spacing, medium card spacing, and tight internal control spacing.

### Elevation system

- Prefer borders and soft shadows over heavy depth.
- Use depth only for overlays, modals, and toasts.

### Border radius

- Buttons: medium.
- Inputs: medium.
- Cards: medium-large.
- Overlays: medium-large.

### Icon style

- Thin, geometric, and consistent.
- Avoid decorative icons.

### Button philosophy

- One obvious primary action per screen.
- Secondary actions visually quieter.
- Destructive actions clearly separated.

### Card philosophy

- Cards should feel like modular workspace panels.
- Consistent paddings and headers.

### Inputs

- Large enough to feel calm.
- Clear focus ring.
- Labels should be explicit.

### Tables

- If introduced later, they should be dense but breathable.

### Sidebar

- A compact command rail with strong active-state affordance.

### Navigation

- Top-level navigation should remain shallow.
- Surface current context clearly.

### Forms

- Inline validation.
- Immediate feedback.
- Minimal friction.

### Charts

- If added, they should be small, readable, and not over-animated.

### Animations

- Keep subtle.
- Use motion to clarify state change, not to impress.

### Transitions

- Short, eased transitions for hover, focus, and panel changes.

### Microinteractions

- Checkbox completion.
- Task creation confirmation.
- Auth state transitions.

### Loading skeletons

- Use calm gray skeletons for dashboard cards and lists.

### Toast style

- Small, unobtrusive, bottom-corner placement.

### Modal behavior

- Centered on desktop.
- Full-height sheet behavior on mobile if needed later.

### Responsive behavior

- Desktop-first density with graceful collapse.

### Dark mode behavior

- Worth supporting later, but only after the light theme is coherent.

This direction would fit a premium productivity product without copying Notion, Linear, or Todoist directly.

## 17. Suggested Refactoring

### 1. Introduce persistent domain storage

- Impact: very high
- Difficulty: high
- Priority: critical

Why:

- Nothing real can ship until tasks, habits, and user settings persist.

### 2. Split dashboard into feature components

- Impact: high
- Difficulty: medium
- Priority: critical

Why:

- The current page file will become unmanageable as soon as more than one feature lands.

### 3. Add a data model and database layer

- Impact: very high
- Difficulty: high
- Priority: critical

Why:

- The product needs a source of truth beyond browser memory.

### 4. Add authenticated API or server action boundaries

- Impact: high
- Difficulty: medium-high
- Priority: critical

Why:

- The client should not own all business logic once persistence exists.

### 5. Add loading, error, and empty states

- Impact: high
- Difficulty: medium
- Priority: high

Why:

- This is necessary for a product-quality experience.

### 6. Define a shared design system

- Impact: high
- Difficulty: medium
- Priority: high

Why:

- It will keep the app coherent as the number of screens increases.

### 7. Normalize naming and product vocabulary

- Impact: medium
- Difficulty: low
- Priority: high

Why:

- The app needs a consistent mental model.

### 8. Add tests

- Impact: high
- Difficulty: medium
- Priority: high

Why:

- The current codebase has no safety net.

### 9. Add role and authorization policy scaffolding

- Impact: medium-high
- Difficulty: medium
- Priority: medium

Why:

- Future collaboration/team features will require it.

### 10. Split styling into structured layers

- Impact: medium
- Difficulty: medium
- Priority: medium

Why:

- The CSS is still a single-file global style sheet.

## 18. Future Scalability

### Thousands of users

Current readiness: low.

Why:

- No database.
- No API.
- No caching.
- No load strategy.
- No observability.

### Real-time sync

Current readiness: very low.

Why:

- No persistent models and no subscription mechanism.

### Mobile app

Current readiness: low to medium for product concept, low for implementation.

Why:

- The UI direction is responsive and could translate well.
- There is no shared app logic or backend contract yet.

### Offline mode

Current readiness: very low.

Why:

- No local persistence or sync engine.

### PWA

Current readiness: low.

Why:

- No manifest, service worker, or offline strategy.

### Teams

Current readiness: very low.

Why:

- No workspace model, roles, or permissions.

### Collaboration

Current readiness: very low.

Why:

- No shared entities or live sync architecture.

### AI features

Current readiness: low conceptually, low technically.

Why:

- Nothing blocks it at the UI level, but there is no data model or integration layer yet.

### Plugins

Current readiness: low.

Why:

- No plugin architecture or extension points.

## 19. Final Score

Scores are out of 10.

- Architecture: 3
- Maintainability: 4
- Code Quality: 6
- Scalability: 2
- Performance: 6
- UI: 7
- UX: 4
- Accessibility: 5
- Developer Experience: 6
- Overall project score: 4.8

### Brutally honest assessment

This is a promising prototype scaffold, not yet a production app architecture.

The UI direction is decent, the auth integration is on the right track, and the code is small enough to understand immediately. But almost every real product concern is still missing: storage, backend boundaries, validation, testing, error handling, and structure. The app is currently good at proving the aesthetic and basic interaction model, not at supporting real productivity workflows.

## Top 50 Improvements, Ranked

1. Add durable persistence for tasks.
2. Split the dashboard into feature components.
3. Introduce a database schema.
4. Add a server-side data access layer.
5. Define task CRUD end to end.
6. Add loading states for auth and dashboard data.
7. Add empty states for all major panels.
8. Add edit and delete for tasks.
9. Add habit persistence.
10. Add focus-session persistence.
11. Add user settings storage.
12. Add validation for task and habit forms.
13. Add error boundaries.
14. Add toast or inline feedback for mutations.
15. Add a reusable button component API.
16. Add a reusable card component API.
17. Add a reusable input component API.
18. Add a proper design token file.
19. Add semantic color tokens.
20. Add a typography scale.
21. Add accessible labels for all interactive controls.
22. Add keyboard-friendly task controls.
23. Add a mobile-specific navigation strategy.
24. Add dark mode planning.
25. Add authentication-aware protected routes.
26. Add role and permission scaffolding.
27. Add a user profile/settings screen.
28. Add account avatar and metadata display with fallbacks.
29. Add onboarding for first-time users.
30. Add task categories or tags.
31. Add task due dates and scheduling.
32. Add recurring tasks.
33. Add habit streak tracking.
34. Add focus timer session history.
35. Add performance profiling once data grows.
36. Add tests for state and rendering logic.
37. Add tests for auth-aware rendering.
38. Add integration tests for create/update/delete flows.
39. Add lint rules for consistency.
40. Add formatting automation.
41. Add CI checks.
42. Add deployment configuration.
43. Add observability/error monitoring.
44. Add analytics or event tracking.
45. Add offline-first local persistence strategy.
46. Add sync conflict handling.
47. Add collaboration primitives if teams are planned.
48. Add API versioning if public endpoints are introduced.
49. Add mobile app shared domain logic.
50. Remove or retire the standalone HTML prototype once the Next.js app fully supersedes it.

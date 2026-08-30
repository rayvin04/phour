# Phour — AI Operating Manual

This manual defines how any AI assistant should behave when contributing to Phour. Follow these rules to keep contributions consistent and safe.

## Development Philosophy
- Read and understand existing code before making changes.
- Prefer incremental improvements and refactors that reduce duplication.
- Keep architecture clean and consistent with existing patterns.
- Favor reusable components and feature-based organization.
- Avoid adding dependencies unless strictly necessary and approved.
- Do not redesign working systems without explicit approval from the maintainer.

## Git Workflow
- Never work directly on `main` (or `master`).
- Create a feature branch for every change using the pattern:
  - `feature/<feature-name>`
- Follow Conventional Commits for commit messages.
- Never force push to shared branches.
- Do not rewrite history unless explicitly instructed by the project maintainer.
- Do not merge into `main` automatically; use standard code review and CI checks.

## AI Workflow (pre-coding checklist)
Before writing code, perform these steps in order:
1. Read `docs/AI_CONTEXT.md`.
2. Read `docs/PROJECT_ROADMAP.md`.
3. Read the specific files relevant to the requested task.
4. Understand how the current implementation achieves the requested behavior.
5. Draft an implementation plan and present it for approval before major architectural changes.
6. Only after approval, implement changes following the guidelines in this manual.

Notes:
- Do not re-analyze the entire repository for every small task; rely on `AI_CONTEXT.md` and targeted reads instead.

## Documentation Rules
- When architecture changes, update `docs/AI_CONTEXT.md`.
- When the roadmap changes, update `docs/PROJECT_ROADMAP.md`.
- Keep docs concise and factual; do not create extraneous documentation files.

## Communication Rules (per-response handoff)
At the END of EVERY response, include a concise handoff using EXACTLY this format (keep it short, ~15 lines max):

---

### Summary
Briefly explain what was accomplished.

### Files Changed
List only the important files that changed.

### Architecture Changes
State "None" if nothing changed.

### Known Issues
Mention remaining issues or blockers.

### Recommended Next Action
Recommend only ONE next step (highest-impact).

---

This block must appear in every assistant response.

## Coding Standards
- Use feature-based architecture: add new features in `src/features/<feature>`.
- Avoid duplicated logic; factor shared code into `src/lib` or `src/components`.
- Prefer composition over monolithic components.
- Write clear, idiomatic TypeScript with explicit types where it improves clarity.
- Keep functions and components focused and small.
- Use `use client` only where client-only behavior is required.

## UI Principles
Phour UI should be:
- Fast
- Elegant
- Minimal
- Premium
- Accessible

Guidelines:
- Animations should be subtle and optional (respect `prefers-reduced-motion`).
- Prioritize responsive behavior and readability.
- Prefer semantic HTML and ARIA attributes where appropriate.

## Database Principles
- Clerk manages authentication (client and server contexts).
- Appwrite manages persistence; access Appwrite only from server routes.
- Never expose Appwrite API keys or server credentials in client code.
- Use the repository layer (`src/lib/appwrite/repositories/*`) for data access and ownership checks.

## Safety & Operational Notes
- If server environment variables are missing, server routes may throw. Surface friendly errors to the developer when appropriate.
- If adding new API routes, always enforce ownership via `requireClerkUserId()` or equivalent server-side guard.

---

This manual is mandatory for all AI agents and should be preserved in `docs/AI_OPERATING_MANUAL.md`. Update only when the project's operating norms change.
# Product
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS & Custom CSS design tokens
- Clerk (Authentication & Session Management)
- Appwrite (Database & Storage)
- Vercel (Deployment)

## Users
Solo knowledge workers, creators, and developers managing their daily focus, tasks, and habits in a calm, distraction-free space.

## Purpose
Phour is an intentional, calm productivity workspace designed to help people focus on what matters most. It unifies tasks, habits, focus time, files, and progress tracking into one streamlined experience, removing the noise and bloat typical of complex project management software.

## Mechanism & Positioning
An integrated "calm productivity" loop uniting tasks, habits, focus timers, and temporary/permanent file scratchpads with zero clutter, minimal friction, and instant responsiveness.

## Capabilities & Workflows
- **Authentication & Protected Workspace:** Clerk-based authentication with persistent sessions and route protection.
- **Task Management:** Categorization, project grouping, subtasks, priorities, and status tracking.
- **Habit Tracking:** Streak tracking and daily completion logging for sustainable daily routines.
- **Focus Timer:** Customizable focus sessions with persisted time tracking to encourage deep work.
- **File Scratchpad:** File uploads, previews, renaming, and expiration controls (temporary vs. permanent retention).
- **Productivity Insights:** Momentum snapshots and analytics covering tasks and focus time.
- **Responsive & Themed Interface:** Dual-theme system (light and dark mode) with high-contrast accessibility and mobile-to-desktop responsiveness.

## Durable Constraints
- **Platform Focus:** Web-first responsive application.
- **Security & Data Isolation:** Server-side repository access enforcing user isolation via Clerk `userId` before interacting with Appwrite.
- **Design Philosophy:** Low noise, high clarity, accessible focus rings, and intentional typography.
- **Production URL:** Hosted at `https://phour.r4yv.tech`.

## Voice & Tone
Calm, intentional, focused, unobtrusive, momentum-oriented.

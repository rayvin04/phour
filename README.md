# Phour

Phour is a calm, intentional productivity workspace built with Next.js and Clerk. It is designed around clarity, focus, and making space for meaningful work.

## Local setup

```bash
pnpm install
npx clerk@latest auth login
npx clerk@latest init --app app_3IXsyScplyfX6iUGtrMtQ3GomwN
npx clerk@latest doctor
pnpm dev
```

The Clerk CLI creates or updates `.env.local`; never commit that file. Enable Google under **SSO connections** in the Clerk Dashboard to allow Gmail sign-in.

## Foundation

- `src/app` contains routes, the root layout, metadata, and global tokens.
- `src/components/ui` contains small reusable presentation primitives.
- `src/features/tasks` owns task types, state, and task UI.
- Clerk remains the authentication boundary; domain persistence is intentionally deferred until a data provider is selected.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the current system map and prioritized production roadmap.

## Appwrite persistence

Phour uses Clerk for authentication and Appwrite for application data. Copy `.env.example` to `.env.local`, add the server-only Appwrite values, then create the collections documented in [APPWRITE_SCHEMA.md](./APPWRITE_SCHEMA.md). Do not expose `APPWRITE_API_KEY` to the browser.

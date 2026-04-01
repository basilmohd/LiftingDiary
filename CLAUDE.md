# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Docs-First Rule

Before generating any code, **always check the `/docs` directory first** for relevant documentation. If a docs file exists for the technology or feature you're working with, read it before writing any code. The `/docs` directory contains authoritative guidance that takes precedence over general knowledge:

- /docs/ui.md
- /docs/data-fetching.md
- /docs/data-mutations.md
- /docs/auth.md
- /docs/server-components.md
- /docs/routing.md

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```
No test framework is configured yet.


## Architecture

This is a **Next.js 16 App Router** project (TypeScript + Tailwind CSS v4) for tracking weightlifting workouts.

**Auth**: Clerk (`@clerk/nextjs`) wraps the entire app via `ClerkProvider` in `app/layout.tsx`. The Clerk middleware lives at `src/middleware.ts` and protects all `/dashboard` routes.

**Styling**: Tailwind CSS v4 with PostCSS. Fonts are Geist Sans and Geist Mono loaded via `next/font/google`.

**Current state**: Very early — `app/page.tsx` is still the default Create Next App template. The auth shell (ClerkProvider + sign-in/sign-up/user buttons in the header) is in place in `app/layout.tsx`.

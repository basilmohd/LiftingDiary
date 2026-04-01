# Routing Coding Standards

## Route Structure

All application routes live under `/dashboard`. The root `/` is a public landing page only — signed-in users are automatically redirected to `/dashboard`.

```
/                          → public (redirects to /dashboard if signed in)
/dashboard                 → protected: workout list / home
/dashboard/workout/new     → protected: create a new workout
/dashboard/workout/[id]    → protected: view/edit a workout
```

## Route Protection

**All protection is handled in `src/middleware.ts` via Clerk middleware.** Do NOT add auth guards inside individual page components.

```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})
```

- `createRouteMatcher(['/dashboard(.*)'])` covers `/dashboard` and all sub-routes
- `auth.protect()` redirects unauthenticated users to the Clerk sign-in page automatically
- Adding a new protected sub-route under `/dashboard` requires no middleware changes — it is covered by the existing matcher

## Adding New Routes

1. Create the page under `src/app/dashboard/` (e.g. `src/app/dashboard/settings/page.tsx`)
2. No middleware changes needed — `/dashboard(.*)` already protects it
3. If a route must be **public** (e.g. a marketing page), add it explicitly to a `isPublicRoute` matcher and skip `auth.protect()` for it

## Rules

- **Never** add route protection logic inside `page.tsx` — use middleware only
- **Never** place new app pages outside `/dashboard` unless they are intentionally public
- **Always** use Next.js file-system routing — no manual route registration
- The middleware matcher in `export const config` must remain broad enough to cover all app routes (the current regex excludes static assets and `_next` — do not narrow it further)

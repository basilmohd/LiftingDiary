# Auth Coding Standards

## Provider

**This app uses [Clerk](https://clerk.com) for all authentication.** Do NOT implement custom auth, sessions, JWTs, or any other auth mechanism.

- `ClerkProvider` wraps the entire app in `app/layout.tsx`
- The Clerk middleware lives at `middleware.ts` in the project root (currently misnamed `proxy.ts` — it must be renamed to work correctly with Next.js)

## Getting the Current User

### In Server Components and Server Actions

Use `auth()` from `@clerk/nextjs/server`:

```ts
import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) return null; // or redirect("/sign-in")
  // ...
}
```

### In Client Components

Use the `useAuth` or `useUser` hooks from `@clerk/nextjs`:

```ts
"use client";
import { useAuth } from "@clerk/nextjs";

export function SomeClientComponent() {
  const { userId, isSignedIn } = useAuth();
  // ...
}
```

## UI Components

Use Clerk's pre-built components for all auth UI. Do NOT build custom sign-in/sign-up forms.

| Component | Usage |
|---|---|
| `<SignInButton>` | Triggers sign-in (use `mode="modal"`) |
| `<SignUpButton>` | Triggers sign-up (use `mode="modal"`) |
| `<UserButton>` | Signed-in user avatar + menu |
| `<Show when="signed-in">` | Conditionally render for signed-in users |
| `<Show when="signed-out">` | Conditionally render for signed-out users |

Example (already in use in `app/layout.tsx`):

```tsx
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

<Show when="signed-out">
  <SignInButton mode="modal">
    <button>Sign In</button>
  </SignInButton>
  <SignUpButton mode="modal">
    <button>Sign Up</button>
  </SignUpButton>
</Show>
<Show when="signed-in">
  <UserButton />
</Show>
```

## Route Protection

Protect routes via the Clerk middleware (`middleware.ts`), not inside individual page components. Configure which routes are public vs. protected there.

## Rules

- **Never** roll your own auth — always use Clerk APIs
- **Never** store user passwords, tokens, or session state manually
- **Always** check `userId` before accessing user data — see `/docs/data-fetching.md` for how to scope database queries to the current user
- **Never** trust client-supplied user IDs — always derive `userId` from `auth()` on the server

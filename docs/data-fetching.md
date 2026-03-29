# Data Fetching

## CRITICAL RULES

### 1. Server Components Only

ALL data fetching in this app MUST be done via **React Server Components**.

- **DO NOT** fetch data in route handlers (`app/api/`)
- **DO NOT** fetch data in client components (`"use client"`)
- **DO NOT** use `useEffect` + `fetch` patterns
- **DO NOT** use SWR, React Query, or any client-side fetching libraries

Every page or component that needs data must be a server component that calls a helper function from the `/data` directory directly.

### 2. All Database Queries via `/data` Helper Functions

Database access must only happen through helper functions located in the `/data` directory. These functions:

- Use **Drizzle ORM** exclusively — never raw SQL strings
- Accept the current user's ID as a parameter and always scope queries to that user
- Are the single source of truth for all database interactions

**DO NOT** write Drizzle queries inline in page or component files. Always extract them into a `/data` helper.

### 3. User Data Isolation — Non-Negotiable

Every query MUST be scoped to the authenticated user. A logged-in user must **never** be able to read or write another user's data.

**Always** get the current user from Clerk in the server component, then pass the `userId` to the data helper:

```ts
// app/some-page/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getUserWorkouts } from "@/data/workouts";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) return null; // or redirect to sign-in

  const workouts = await getUserWorkouts(userId);
  // ...
}
```

```ts
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserWorkouts(userId: string) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}
```

The `userId` filter must be present on **every** query. Never query a table without filtering by the current user's ID.

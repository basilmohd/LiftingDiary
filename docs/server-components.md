# Server Components

## CRITICAL RULES

### 1. `params` and `searchParams` MUST Be Awaited

This is **Next.js 15**. Route params and search params are **Promises** — you must `await` them before accessing any property.

**DO NOT** destructure params synchronously:

```ts
// WRONG — will throw or return undefined in Next.js 15
export default async function Page({ params }: { params: { workoutId: string } }) {
  const { workoutId } = params; // ❌ params is a Promise
}
```

**Always** await params first:

```ts
// CORRECT
export default async function Page({ params }: { params: Promise<{ workoutId: string }> }) {
  const { workoutId } = await params; // ✅
}
```

Same rule applies to `searchParams`:

```ts
// CORRECT
export default async function Page({ searchParams }: { searchParams: Promise<{ tab: string }> }) {
  const { tab } = await searchParams; // ✅
}
```

### 2. Type Params as `Promise<...>`

Always type `params` and `searchParams` as `Promise<{ ... }>` in the function signature — not as plain objects.

```ts
// Dynamic segment page
type Props = {
  params: Promise<{ workoutId: string }>;
};

export default async function Page({ params }: Props) {
  const { workoutId } = await params;
  // ...
}
```

### 3. Server Components Are Async by Default

All pages and server components that access params, fetch data, or call `auth()` must be declared `async`:

```ts
export default async function Page({ params }: Props) {
  const { workoutId } = await params;
  const { userId } = await auth();
  // ...
}
```

### 4. Combining Params with Auth and Data Fetching

When a page needs both the route param and the current user, await them before calling data helpers:

```ts
import { auth } from "@clerk/nextjs/server";
import { getWorkout } from "@/data/workouts";

type Props = {
  params: Promise<{ workoutId: string }>;
};

export default async function Page({ params }: Props) {
  const { workoutId } = await params;
  const { userId } = await auth();

  if (!userId) return null;

  const workout = await getWorkout(workoutId, userId);
  // ...
}
```

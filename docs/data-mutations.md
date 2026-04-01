# Data Mutations

## CRITICAL RULES

### 1. All Database Mutations via `/data` Helper Functions

ALL database writes (insert, update, delete) MUST go through helper functions in `src/data/`. Inline Drizzle calls in server actions or components are forbidden.

- Use **Drizzle ORM** exclusively — never raw SQL strings
- Mutation helpers live in `src/data/mutations.ts` (or a per-domain file if the file grows large)
- Each helper accepts a typed input object — never raw DB row shapes passed directly from the action layer

```ts
// src/data/mutations.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";

export type InsertWorkoutInput = {
  userId: string;
  name: string | null;
  startedAt: Date;
};

export async function insertWorkout(input: InsertWorkoutInput): Promise<void> {
  await db.insert(workouts).values({
    userId: input.userId,
    name: input.name,
    startedAt: input.startedAt,
  });
}
```

### 2. Server Actions Only — No Route Handlers

ALL mutations triggered from the UI MUST go through **Next.js Server Actions**.

- **DO NOT** create `app/api/` route handlers for mutations
- **DO NOT** call mutation helpers directly from client components
- Server actions are the only valid call site for `/data` mutation helpers

### 3. Server Actions Must Be Colocated in `actions.ts`

Each route segment that needs mutations gets a single colocated `actions.ts` file.

```
app/
  dashboard/
    page.tsx
    actions.ts       ✅ colocated server actions
    _components/
      AddWorkoutForm.tsx
```

- The file MUST start with `"use server";`
- **DO NOT** spread server actions across multiple files in the same route segment
- **DO NOT** define server actions inline inside component files

### 4. Typed Parameters — No `FormData`

Server action parameters MUST be typed TypeScript objects. `FormData` is forbidden.

```ts
// ✅ correct
export async function createWorkout(input: CreateWorkoutInput): Promise<CreateWorkoutResult> { ... }

// ❌ wrong
export async function createWorkout(formData: FormData) { ... }
```

Define input types in the same `actions.ts` file and `export` them so client components can import and use them.

### 5. Validate All Inputs with Zod

Every server action MUST validate its arguments with a **Zod schema** before doing anything else (including auth checks on the input shape).

```ts
"use server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { insertWorkout } from "@/data/mutations";

const CreateWorkoutSchema = z.object({
  name: z.string(),
  startedAt: z.string().datetime(),
  exercises: z.array(
    z.object({
      name: z.string().min(1),
      sets: z.array(
        z.object({
          reps: z.number().int().positive(),
          weight: z.number().nonnegative(),
        })
      ).min(1),
    })
  ).min(1),
});

export type CreateWorkoutInput = z.infer<typeof CreateWorkoutSchema>;
export type CreateWorkoutResult = { success: true } | { success: false; error: string };

export async function createWorkout(input: CreateWorkoutInput): Promise<CreateWorkoutResult> {
  const parsed = CreateWorkoutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  await insertWorkout({ userId, ...parsed.data, startedAt: new Date(parsed.data.startedAt) });
  revalidatePath("/dashboard");
  return { success: true };
}
```

- Derive the exported TypeScript input type from the Zod schema via `z.infer<>` — do not maintain a separate hand-written type alongside the schema
- Use `safeParse` (not `parse`) so validation failures return a structured error rather than throwing
- Return the first validation issue as the error message — do not expose internal Zod error details beyond that

### 6. User Data Isolation — Non-Negotiable

Every mutation MUST be scoped to the authenticated user. A user must **never** be able to write or delete another user's data.

- Get `userId` from Clerk inside the server action (`auth()`) — never trust a `userId` passed in from the client
- Pass `userId` down to the `/data` helper — the helper applies it to the query

```ts
// ✅ correct — userId comes from auth(), not from the client payload
const { userId } = await auth();
await insertWorkout({ userId, ... });

// ❌ wrong — never trust userId from the client
await insertWorkout({ userId: input.userId, ... });
```

### 7. Return a Typed Result Object

Server actions MUST return a discriminated union result, never throw to the client.

```ts
export type MyActionResult = { success: true } | { success: false; error: string };
```

- `success: true` — mutation completed; include any returned data as additional fields if needed
- `success: false; error: string` — a user-facing error message the UI can display
- Wrap the `/data` helper call in a `try/catch` and map unexpected errors to `{ success: false, error: "..." }`

### 8. No Redirects in Server Actions

Do **not** call `redirect()` from `next/navigation` inside server actions. Redirects must be handled client-side after the server action resolves.

```ts
// ✅ correct — redirect happens in the client component
const result = await createWorkout(input);
if (result.success) router.push("/dashboard");

// ❌ wrong — redirect() inside a server action
export async function createWorkout(input: CreateWorkoutInput) {
  await insertWorkout({ ... });
  redirect("/dashboard"); // forbidden
}
```

### 9. Revalidate After Mutations

Call `revalidatePath` (or `revalidateTag`) at the end of a successful mutation to keep the UI in sync.

```ts
import { revalidatePath } from "next/cache";

revalidatePath("/dashboard");
return { success: true };
```

# Lifting Diary — Technical Summary

## Overview

**Lifting Diary** is a Next.js 16 App Router application for tracking weightlifting sessions. It uses Clerk for auth, Drizzle ORM + Neon PostgreSQL for data, and shadcn/ui + Tailwind CSS v4 for the UI.

---

## App Workflow (Component-by-Component)

### 1. Root Layout — `src/app/layout.tsx`
**Type:** Server Component (Root Layout)

Wraps the entire app. Renders a global header with the "Lifting Diary" title, a theme toggle (light/dark via `next-themes`), and Clerk auth UI — sign-in/sign-up buttons when signed out, `<UserButton>` when signed in. Provides `<ClerkProvider>` and `<ThemeProvider>` context to all children.

**Data communication:** None — purely structural layout.

---

### 2. Home Page — `src/app/page.tsx`
**Type:** Server Component  
**Route:** `/`

Default Next.js template page. Signed-in users never reach it — the Clerk middleware at `src/middleware.ts` redirects authenticated requests from `/` to `/dashboard`.

**Data communication:** None.

---

### 3. Dashboard Page — `src/app/dashboard/page.tsx`
**Type:** Server Component  
**Route:** `/dashboard` (protected)

The main screen. Reads a `?date=YYYY-MM-DD` query param (defaults to today) and fetches all workouts for the current user on that date. Renders a date picker, a "Log New Workout" button, and a list of workout cards. Each card shows the workout name, exercises, and sets. Clicking a workout navigates to the edit page.

**Data communication:**
- Calls `auth()` (Clerk server-side) to get `userId`.
- Calls `getWorkoutsForDate(userId, date)` → `src/data/workouts.ts` → Drizzle query (LEFT JOIN: `workouts → workout_exercises → exercises → sets`).
- Passes loaded data as props to client components below.

**Client components rendered:**
- `<WorkoutDatePicker>` — date navigation
- `<LogWorkoutButton>` — creates a new empty workout session

---

### 4. WorkoutDatePicker — `src/app/dashboard/_components/WorkoutDatePicker.tsx`
**Type:** Client Component

Renders a popover with a shadcn/ui `<Calendar>`. On date select, pushes `?date=YYYY-MM-DD` to the URL via `router.push`, which triggers a new server-side render of the dashboard page.

**Data communication:** No direct DB calls — communicates with the server by updating the URL.

---

### 5. LogWorkoutButton — `src/app/dashboard/_components/LogWorkoutButton.tsx`
**Type:** Client Component

Single button: "Log New Workout". On click, calls the `createEmptyWorkout(startedAt)` server action. On success, redirects to `/dashboard/workout/[workoutId]?date=...`.

**Data communication:** Calls `createEmptyWorkout()` server action → `src/data/mutations.ts:insertEmptyWorkout()` → inserts a bare `workouts` row → returns `workoutId`.

---

### 6. Edit Workout Page — `src/app/dashboard/workout/[workoutId]/page.tsx`
**Type:** Server Component  
**Route:** `/dashboard/workout/[workoutId]` (protected)

Fetches the full workout detail (exercises + sets) by `workoutId` and all available exercise names for the dropdown. Returns a 404 if the workout isn't found or doesn't belong to the current user. Passes the loaded data to `<EditWorkoutForm>`.

**Data communication:**
- Calls `auth()` for `userId`.
- Calls `getWorkoutById(userId, workoutId)` and `getExercises()` in parallel → `src/data/workouts.ts` → Drizzle queries.

---

### 7. EditWorkoutForm — `src/app/dashboard/workout/[workoutId]/_components/EditWorkoutForm.tsx`
**Type:** Client Component

The core interactive form for modifying an existing workout. Manages a local copy of the workout state. Sets have two modes: `"saved"` (read-only table row) and `"editing"` (inline inputs). Users can add/remove exercises from a dropdown or by typing a name, add/remove/edit individual sets. On submit, validates that all exercises have at least one set and sends the full workout to the server.

**Data communication:** Calls `updateWorkoutAction(input)` server action → `src/data/mutations.ts:updateWorkout()` → deletes old `workout_exercises`/`sets`, inserts updated records → revalidates `/dashboard` and the workout page cache.

---

### 8. New Workout Page — `src/app/dashboard/workout/new/page.tsx`
**Type:** Server Component  
**Route:** `/dashboard/workout/new` (protected)

Dedicated page for creating a workout from scratch. Renders `<NewWorkoutForm>`.

**Data communication:** None at page level — the form handles creation.

---

### 9. NewWorkoutForm — `src/app/dashboard/workout/new/_components/NewWorkoutForm.tsx`
**Type:** Client Component

Identical in structure to `AddWorkoutForm`. Renders a form with workout name, start time, and a dynamic list of exercises with sets. On submit, validates and calls a server action.

**Data communication:** Calls `createWorkout(input)` server action → `src/data/mutations.ts:insertWorkout()` → upserts exercises, batch-inserts workout + workout_exercises + sets → revalidates `/dashboard`.

---

## Data Layer

### Queries — `src/data/workouts.ts`

| Function | Used By | Description |
|---|---|---|
| `getWorkoutsForDate(userId, date)` | Dashboard page | Fetches all workouts for a user on a given day via JOIN across all 4 tables. |
| `getWorkoutById(userId, workoutId)` | Edit workout page | Fetches single workout with full exercise/set tree. Returns null if not found or wrong user. |
| `getExercises()` | Edit workout page | Returns all distinct exercise names (alphabetically) for the dropdown. |

### Mutations — `src/data/mutations.ts`

| Function | Called By | Description |
|---|---|---|
| `insertEmptyWorkout({ userId, startedAt })` | `createEmptyWorkout` action | Inserts a bare workout row, returns the new `workoutId`. |
| `insertWorkout(input)` | `createWorkout` action | Upserts exercises, batch-inserts workout + workout_exercises + sets in one `db.batch()` call. |
| `updateWorkout(input)` | `updateWorkoutAction` | Updates the workout row, deletes old workout_exercises (cascade deletes sets), inserts fresh records. |

### Server Actions

| File | Action | Validates With | Calls |
|---|---|---|---|
| `src/app/dashboard/actions.ts` | `createEmptyWorkout` | Manual checks | `insertEmptyWorkout` |
| `src/app/dashboard/actions.ts` | `createWorkout` | Manual checks | `insertWorkout` |
| `src/app/dashboard/workout/[workoutId]/actions.ts` | `updateWorkoutAction` | Zod schema | `updateWorkout` |

All server actions call `auth()` to get the `userId` before touching the database. All revalidate relevant paths via `revalidatePath()` after mutations.

---

## Database Schema — `src/db/schema.ts`

```
exercises        — id, name (unique), createdAt, updatedAt
workouts         — id, userId (Clerk), name?, startedAt, completedAt?, createdAt, updatedAt
workout_exercises — id, workoutId (FK → workouts, cascade), exerciseId (FK → exercises), order
sets             — id, workoutExerciseId (FK → workout_exercises, cascade), setNumber, reps, weight
```

Relations: `workouts` → `workout_exercises` → `exercises` and `sets`. Cascade deletes propagate from workouts down to sets. The `exercises` table is a shared catalog (not scoped per user) — uniqueness is by name.

Database instance (`src/db/index.ts`) uses the Neon serverless HTTP driver — no connection pooling required.

---

## Auth Flow — `src/middleware.ts`

Clerk middleware runs on every request:
1. All `/dashboard/*` routes → `auth.protect()` (redirects unauthenticated users to Clerk sign-in).
2. Authenticated users hitting `/` → redirected to `/dashboard`.
3. In server components and actions, `userId` is obtained via `await auth()`.

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                              # Server — root layout, Clerk + theme providers
│   ├── page.tsx                                # Server — home page (unused, middleware redirects)
│   └── dashboard/
│       ├── page.tsx                            # Server — date-scoped workout list
│       ├── actions.ts                          # Server actions — createEmptyWorkout, createWorkout
│       ├── _components/
│       │   ├── WorkoutDatePicker.tsx           # Client — calendar popover, URL navigation
│       │   └── LogWorkoutButton.tsx            # Client — creates empty workout, redirects
│       └── workout/
│           ├── new/
│           │   ├── page.tsx                    # Server — new workout page shell
│           │   └── _components/
│           │       └── NewWorkoutForm.tsx      # Client — full workout creation form
│           └── [workoutId]/
│               ├── page.tsx                    # Server — loads workout + exercises for edit
│               ├── actions.ts                  # Server actions — updateWorkoutAction
│               └── _components/
│                   └── EditWorkoutForm.tsx     # Client — inline-editing workout form
├── data/
│   ├── workouts.ts                             # DB read helpers (queries)
│   └── mutations.ts                            # DB write helpers (inserts/updates)
├── db/
│   ├── index.ts                                # Drizzle + Neon instance
│   └── schema.ts                              # Table definitions + relations
└── middleware.ts                               # Clerk route protection + redirect
components/
├── theme-provider.tsx                          # next-themes wrapper
├── theme-toggle.tsx                            # Light/dark toggle button
└── ui/                                         # shadcn/ui components
```

---

## Key Patterns

- **Server components fetch, client components render interactively.** Pages are always server components; forms are always client components.
- **No API routes.** All mutations go through Next.js Server Actions (`"use server"`).
- **userId is always from Clerk `auth()` — never from the client.** Every query and mutation filters or scopes by `userId`.
- **Batch inserts via `db.batch()`** to minimize round-trips on the Neon serverless HTTP driver.
- **Cache invalidation via `revalidatePath()`** after every mutation so the dashboard reflects changes immediately.

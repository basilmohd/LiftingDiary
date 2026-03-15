import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// exercises — catalog of named movements (shared across all users)
// ---------------------------------------------------------------------------

export const exercises = pgTable('exercises', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// workouts — one row per training session
// ---------------------------------------------------------------------------

export const workouts = pgTable(
  'workouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(), // Clerk user ID (e.g. "user_2abc...")
    name: text('name'),                // optional label, e.g. "Monday Push"
    startedAt: timestamp('started_at').notNull(),
    completedAt: timestamp('completed_at'), // null = session still in progress
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('workouts_user_id_idx').on(t.userId)],
);

// ---------------------------------------------------------------------------
// workout_exercises — which exercises appeared in a workout, in what order
// ---------------------------------------------------------------------------

export const workoutExercises = pgTable(
  'workout_exercises',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workoutId: uuid('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id),
    order: integer('order').notNull(), // 0-based position within the session
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('workout_exercises_workout_id_idx').on(t.workoutId)],
);

// ---------------------------------------------------------------------------
// sets — individual sets within a workout_exercise entry
// ---------------------------------------------------------------------------

export const sets = pgTable(
  'sets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workoutExerciseId: uuid('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(), // 1-based
    reps: integer('reps').notNull(),
    weight: numeric('weight', { precision: 6, scale: 2 }).notNull(), // e.g. 102.50
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('sets_workout_exercise_id_idx').on(t.workoutExerciseId)],
);

// ---------------------------------------------------------------------------
// Relations (used by Drizzle's relational query API)
// ---------------------------------------------------------------------------

export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

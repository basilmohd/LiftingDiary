import { randomUUID } from "crypto";
import { db } from "@/db";
import { exercises, workouts, workoutExercises, sets } from "@/db/schema";
import { and, eq } from "drizzle-orm";

type SetInput = { reps: number; weight: number };
type ExerciseInput = { name: string; sets: SetInput[] };

export type InsertWorkoutInput = {
  userId: string;
  name: string | null;
  startedAt: Date;
  exercises: ExerciseInput[];
};

export async function insertWorkout(input: InsertWorkoutInput): Promise<void> {
  // 1. Upsert all exercises in parallel (find-or-create by unique name)
  const exerciseResults = await Promise.all(
    input.exercises.map((ex) =>
      db
        .insert(exercises)
        .values({ name: ex.name.trim() })
        .onConflictDoUpdate({ target: exercises.name, set: { updatedAt: new Date() } })
        .returning({ id: exercises.id })
        .then((rows) => rows[0])
    )
  );

  // 2. Pre-generate all IDs for batch insert
  const workoutId = randomUUID();
  const workoutExerciseRows = input.exercises.map((_, i) => ({
    id: randomUUID(),
    workoutId,
    exerciseId: exerciseResults[i].id,
    order: i,
  }));
  const setRows = input.exercises.flatMap((ex, i) =>
    ex.sets.map((s, j) => ({
      id: randomUUID(),
      workoutExerciseId: workoutExerciseRows[i].id,
      setNumber: j + 1,
      reps: s.reps,
      weight: String(s.weight),
    }))
  );

  // 3. Batch insert (neon-http does not support transactions, use batch instead)
  await db.batch([
    db.insert(workouts).values({
      id: workoutId,
      userId: input.userId,
      name: input.name,
      startedAt: input.startedAt,
    }),
    ...workoutExerciseRows.map((we) => db.insert(workoutExercises).values(we)),
    ...setRows.map((s) => db.insert(sets).values(s)),
  ]);
}

export type UpdateWorkoutInput = {
  workoutId: string;
  userId: string;
  name: string | null;
  startedAt: Date;
  exercises: ExerciseInput[];
};

export async function updateWorkout(input: UpdateWorkoutInput): Promise<void> {
  // 1. Upsert all exercises in parallel (find-or-create by unique name)
  const exerciseResults = await Promise.all(
    input.exercises.map((ex) =>
      db
        .insert(exercises)
        .values({ name: ex.name.trim() })
        .onConflictDoUpdate({ target: exercises.name, set: { updatedAt: new Date() } })
        .returning({ id: exercises.id })
        .then((rows) => rows[0])
    )
  );

  // 2. Pre-generate IDs for new workout_exercises and sets
  const workoutExerciseRows = input.exercises.map((_, i) => ({
    id: randomUUID(),
    workoutId: input.workoutId,
    exerciseId: exerciseResults[i].id,
    order: i,
  }));
  const setRows = input.exercises.flatMap((ex, i) =>
    ex.sets.map((s, j) => ({
      id: randomUUID(),
      workoutExerciseId: workoutExerciseRows[i].id,
      setNumber: j + 1,
      reps: s.reps,
      weight: String(s.weight),
    }))
  );

  // 3. Batch: update workout, delete old exercises (cascade deletes sets), insert new
  await db.batch([
    db
      .update(workouts)
      .set({ name: input.name, startedAt: input.startedAt, updatedAt: new Date() })
      .where(and(eq(workouts.id, input.workoutId), eq(workouts.userId, input.userId))),
    db.delete(workoutExercises).where(eq(workoutExercises.workoutId, input.workoutId)),
    ...workoutExerciseRows.map((we) => db.insert(workoutExercises).values(we)),
    ...setRows.map((s) => db.insert(sets).values(s)),
  ]);
}

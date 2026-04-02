import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { eq, and, gte, lt, asc } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";

type WorkoutWithDetails = {
  id: string;
  name: string | null;
  startedAt: Date;
  exercises: {
    id: string;
    name: string;
    order: number;
    sets: {
      setNumber: number;
      reps: number;
      weight: string;
    }[];
  }[];
};

export async function getWorkoutsForDate(
  userId: string,
  date: Date
): Promise<WorkoutWithDetails[]> {
  const rows = await db
    .select({
      workoutId: workouts.id,
      workoutName: workouts.name,
      workoutStartedAt: workouts.startedAt,
      workoutExerciseId: workoutExercises.id,
      exerciseOrder: workoutExercises.order,
      exerciseName: exercises.name,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weight: sets.weight,
    })
    .from(workouts)
    .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .leftJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, startOfDay(date)),
        lt(workouts.startedAt, endOfDay(date))
      )
    )
    .orderBy(workoutExercises.order, sets.setNumber);

  const workoutMap = new Map<string, WorkoutWithDetails>();

  for (const row of rows) {
    if (!workoutMap.has(row.workoutId)) {
      workoutMap.set(row.workoutId, {
        id: row.workoutId,
        name: row.workoutName,
        startedAt: row.workoutStartedAt,
        exercises: [],
      });
    }

    const workout = workoutMap.get(row.workoutId)!;

    if (row.workoutExerciseId && row.exerciseName) {
      let exercise = workout.exercises.find(
        (e) => e.id === row.workoutExerciseId
      );
      if (!exercise) {
        exercise = {
          id: row.workoutExerciseId,
          name: row.exerciseName,
          order: row.exerciseOrder ?? 0,
          sets: [],
        };
        workout.exercises.push(exercise);
      }

      if (row.setNumber !== null && row.reps !== null && row.weight !== null) {
        exercise.sets.push({
          setNumber: row.setNumber,
          reps: row.reps,
          weight: row.weight,
        });
      }
    }
  }

  return Array.from(workoutMap.values());
}

export type WorkoutDetail = WorkoutWithDetails;

export async function getWorkoutById(
  userId: string,
  workoutId: string
): Promise<WorkoutWithDetails | null> {
  const rows = await db
    .select({
      workoutId: workouts.id,
      workoutName: workouts.name,
      workoutStartedAt: workouts.startedAt,
      workoutExerciseId: workoutExercises.id,
      exerciseOrder: workoutExercises.order,
      exerciseName: exercises.name,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weight: sets.weight,
    })
    .from(workouts)
    .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .leftJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .orderBy(workoutExercises.order, sets.setNumber);

  if (rows.length === 0) return null;

  const workout: WorkoutWithDetails = {
    id: rows[0].workoutId,
    name: rows[0].workoutName,
    startedAt: rows[0].workoutStartedAt,
    exercises: [],
  };

  for (const row of rows) {
    if (row.workoutExerciseId && row.exerciseName) {
      let exercise = workout.exercises.find((e) => e.id === row.workoutExerciseId);
      if (!exercise) {
        exercise = {
          id: row.workoutExerciseId,
          name: row.exerciseName,
          order: row.exerciseOrder ?? 0,
          sets: [],
        };
        workout.exercises.push(exercise);
      }
      if (row.setNumber !== null && row.reps !== null && row.weight !== null) {
        exercise.sets.push({ setNumber: row.setNumber, reps: row.reps, weight: row.weight });
      }
    }
  }

  return workout;
}

export async function getExercises(): Promise<string[]> {
  const rows = await db
    .select({ name: exercises.name })
    .from(exercises)
    .orderBy(asc(exercises.name));
  return rows.map((r) => r.name);
}

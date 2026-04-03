import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { eq, and, gte, lt, lte, asc, desc, sql, count } from "drizzle-orm";
import { startOfDay, endOfDay, startOfYear, endOfYear, subDays, format } from "date-fns";

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

export async function getWorkoutCountsByMonth(
  userId: string,
  year: number
): Promise<{ month: number; count: number }[]> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const rows = await db
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${workouts.startedAt})::int`,
      count: count(),
    })
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, yearStart),
        lte(workouts.startedAt, yearEnd)
      )
    )
    .groupBy(sql`EXTRACT(MONTH FROM ${workouts.startedAt})`)
    .orderBy(sql`EXTRACT(MONTH FROM ${workouts.startedAt})`);

  const monthMap = new Map(rows.map((r) => [r.month, r.count]));
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    count: monthMap.get(i + 1) ?? 0,
  }));
}

export async function getVolumeByMonth(
  userId: string,
  year: number
): Promise<{ month: number; volume: number }[]> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const rows = await db
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${workouts.startedAt})::int`,
      volume: sql<number>`COALESCE(SUM(${sets.weight}::numeric * ${sets.reps}::numeric), 0)::float`,
    })
    .from(workouts)
    .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, yearStart),
        lte(workouts.startedAt, yearEnd)
      )
    )
    .groupBy(sql`EXTRACT(MONTH FROM ${workouts.startedAt})`)
    .orderBy(sql`EXTRACT(MONTH FROM ${workouts.startedAt})`);

  const monthMap = new Map(rows.map((r) => [r.month, r.volume]));
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    volume: monthMap.get(i + 1) ?? 0,
  }));
}

export async function getExercisesForUser(
  userId: string,
  year: number
): Promise<string[]> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const rows = await db
    .selectDistinct({ name: exercises.name })
    .from(workouts)
    .innerJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, yearStart),
        lte(workouts.startedAt, yearEnd)
      )
    )
    .orderBy(asc(exercises.name));

  return rows.map((r) => r.name);
}

export async function getVolumeByMonthForExercise(
  userId: string,
  year: number,
  exerciseName: string
): Promise<{ month: number; volume: number }[]> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const rows = await db
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${workouts.startedAt})::int`,
      volume: sql<number>`COALESCE(SUM(${sets.weight}::numeric * ${sets.reps}::numeric), 0)::float`,
    })
    .from(workouts)
    .innerJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .innerJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, yearStart),
        lte(workouts.startedAt, yearEnd),
        eq(exercises.name, exerciseName)
      )
    )
    .groupBy(sql`EXTRACT(MONTH FROM ${workouts.startedAt})`)
    .orderBy(sql`EXTRACT(MONTH FROM ${workouts.startedAt})`);

  const monthMap = new Map(rows.map((r) => [r.month, r.volume]));
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    volume: monthMap.get(i + 1) ?? 0,
  }));
}

export async function getTopExercises(
  userId: string,
  year: number,
  limit: number = 5
): Promise<{ name: string; count: number }[]> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const rows = await db
    .select({
      name: exercises.name,
      count: count(),
    })
    .from(workouts)
    .innerJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.startedAt, yearStart),
        lte(workouts.startedAt, yearEnd)
      )
    )
    .groupBy(exercises.id, exercises.name)
    .orderBy(desc(count()))
    .limit(limit);

  return rows.map((r) => ({ name: r.name, count: r.count }));
}

export async function getWorkoutStreak(
  userId: string
): Promise<{ current: number; longest: number }> {
  const rows = await db
    .selectDistinct({
      day: sql<string>`DATE(${workouts.startedAt})`,
    })
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(sql`DATE(${workouts.startedAt})`));

  if (rows.length === 0) return { current: 0, longest: 0 };

  const workoutDays = new Set(rows.map((r) => r.day));
  const today = format(new Date(), "yyyy-MM-dd");

  let current = 0;
  let cursor = new Date();
  if (!workoutDays.has(today)) {
    cursor = subDays(cursor, 1);
  }
  while (workoutDays.has(format(cursor, "yyyy-MM-dd"))) {
    current++;
    cursor = subDays(cursor, 1);
  }

  const sortedDates = rows.map((r) => r.day).reverse();
  let longest = 0;
  let runLength = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      runLength++;
    } else {
      longest = Math.max(longest, runLength);
      runLength = 1;
    }
  }
  longest = Math.max(longest, runLength);

  return { current, longest };
}

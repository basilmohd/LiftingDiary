"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { insertWorkout } from "@/data/mutations";

type SetInput = { reps: number; weight: number };
type ExerciseInput = { name: string; sets: SetInput[] };

export type CreateWorkoutInput = {
  name: string;       // empty string → null
  startedAt: string;  // ISO string (Date not serializable across server action boundary)
  exercises: ExerciseInput[];
};

export type CreateWorkoutResult = { success: true } | { success: false; error: string };

export async function createWorkout(input: CreateWorkoutInput): Promise<CreateWorkoutResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  if (input.exercises.length === 0) return { success: false, error: "Add at least one exercise" };
  for (const ex of input.exercises) {
    if (!ex.name.trim()) return { success: false, error: "Exercise name is required" };
    if (ex.sets.length === 0) return { success: false, error: "Each exercise needs at least one set" };
  }

  try {
    await insertWorkout({
      userId,
      name: input.name.trim() || null,
      startedAt: new Date(input.startedAt),
      exercises: input.exercises,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save workout" };
  }
}

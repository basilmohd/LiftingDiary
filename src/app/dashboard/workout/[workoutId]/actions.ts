"use server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { updateWorkout } from "@/data/mutations";

const UpdateWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
  name: z.string(),
  startedAt: z.string().datetime(),
  exercises: z
    .array(
      z.object({
        name: z.string().min(1),
        sets: z
          .array(
            z.object({
              reps: z.number().int().positive(),
              weight: z.number().nonnegative(),
            })
          )
          .min(1),
      })
    )
    .min(1),
});

export type UpdateWorkoutInput = z.infer<typeof UpdateWorkoutSchema>;
export type UpdateWorkoutResult = { success: true } | { success: false; error: string };

export async function updateWorkoutAction(
  input: UpdateWorkoutInput
): Promise<UpdateWorkoutResult> {
  const parsed = UpdateWorkoutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    await updateWorkout({
      workoutId: parsed.data.workoutId,
      userId,
      name: parsed.data.name.trim() || null,
      startedAt: new Date(parsed.data.startedAt),
      exercises: parsed.data.exercises,
    });
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workout/${parsed.data.workoutId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update workout" };
  }
}

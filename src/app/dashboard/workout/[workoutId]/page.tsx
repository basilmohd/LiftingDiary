import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getWorkoutById } from "@/data/workouts";
import { EditWorkoutForm } from "./_components/EditWorkoutForm";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const workout = await getWorkoutById(userId, workoutId);
  if (!workout) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Edit Workout</h2>
      <EditWorkoutForm workout={workout} />
    </main>
  );
}

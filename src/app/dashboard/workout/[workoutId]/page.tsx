import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { format, parseISO } from "date-fns";
import { buttonVariants } from "@/components/ui/button-variants";
import { getWorkoutById, getExercises } from "@/data/workouts";
import { EditWorkoutForm } from "./_components/EditWorkoutForm";

type Props = {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function EditWorkoutPage({ params, searchParams }: Props) {
  const { workoutId } = await params;
  const { date: dateParam } = await searchParams;

  const { userId } = await auth();
  if (!userId) return null;

  const [workout, availableExercises] = await Promise.all([
    getWorkoutById(userId, workoutId),
    getExercises(),
  ]);

  if (!workout) notFound();

  const date = dateParam ? parseISO(dateParam) : workout.startedAt;
  const dateLabel = format(date, "do MMM yyyy");
  const backHref = `/dashboard?date=${format(date, "yyyy-MM-dd")}`;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Edit Workout</h2>
        <Link href={backHref} className={buttonVariants({ variant: "outline", size: "sm" })}>← Back to Dashboard</Link>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Date: {dateLabel}</p>

      <EditWorkoutForm
        workout={workout}
        dateLabel={dateLabel}
        availableExercises={availableExercises}
      />
    </main>
  );
}

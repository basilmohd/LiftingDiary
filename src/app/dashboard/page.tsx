import { auth } from "@clerk/nextjs/server";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutDatePicker } from "./_components/WorkoutDatePicker";
import { AddWorkoutForm } from "./_components/AddWorkoutForm";
import { getWorkoutsForDate } from "@/data/workouts";

type Props = {
  searchParams: Promise<{ date?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) return null;

  const { date: dateParam } = await searchParams;
  const date = dateParam ? parseISO(dateParam) : new Date();

  const workouts = await getWorkoutsForDate(userId, date);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: add workout */}
        <AddWorkoutForm />

        {/* Right: date picker + workout log */}
        <div className="flex flex-col gap-6">
          <WorkoutDatePicker date={date} label={format(date, "do MMM yyyy")} />

          {workouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workouts logged for this date.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {workouts.map((workout) => (
                <Link key={workout.id} href={`/dashboard/workout/${workout.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {workout.name ?? format(workout.startedAt, "do MMM yyyy")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {workout.exercises.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No exercises recorded.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {workout.exercises.map((exercise) => (
                          <li key={exercise.id}>
                            <p className="text-sm font-medium">{exercise.name}</p>
                            <ul className="mt-1 flex flex-col gap-0.5">
                              {exercise.sets.map((set) => (
                                <li
                                  key={set.setNumber}
                                  className="text-sm text-muted-foreground"
                                >
                                  Set {set.setNumber}: {set.reps} reps &mdash; {set.weight} kg
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

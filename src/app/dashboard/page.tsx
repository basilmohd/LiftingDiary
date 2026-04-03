import { auth } from "@clerk/nextjs/server";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutDatePicker } from "./_components/WorkoutDatePicker";
import { LogWorkoutButton } from "./_components/LogWorkoutButton";
import { MonthlyWorkoutChart } from "./_components/MonthlyWorkoutChart";
import { VolumeTrendChart } from "./_components/VolumeTrendChart";
import { StreakCard } from "./_components/StreakCard";
import { TopExercisesChart } from "./_components/TopExercisesChart";
import {
  getWorkoutsForDate,
  getWorkoutCountsByMonth,
  getVolumeByMonthForExercise,
  getExercisesForUser,
  getTopExercises,
  getWorkoutStreak,
} from "@/data/workouts";

type Props = {
  searchParams: Promise<{ date?: string; exercise?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) return null;

  const { date: dateParam, exercise: exerciseParam } = await searchParams;
  const date = dateParam ? parseISO(dateParam) : new Date();
  const currentYear = new Date().getFullYear();

  const [workouts, monthlyCounts, exerciseList, topExercises, streak] =
    await Promise.all([
      getWorkoutsForDate(userId, date),
      getWorkoutCountsByMonth(userId, currentYear),
      getExercisesForUser(userId, currentYear),
      getTopExercises(userId, currentYear, 5),
      getWorkoutStreak(userId),
    ]);

  const selectedExercise = exerciseParam && exerciseList.includes(exerciseParam)
    ? exerciseParam
    : exerciseList[0] ?? null;

  const volumeByMonth = selectedExercise
    ? await getVolumeByMonthForExercise(userId, currentYear, selectedExercise)
    : [];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <LogWorkoutButton date={date} size="sm" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left panel — date picker + workout list */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <WorkoutDatePicker date={date} label={format(date, "do MMM yyyy")} />

          <p className="text-sm font-medium text-muted-foreground">
            {format(date, "do MMM yyyy")}
          </p>

          {workouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workouts logged for this date.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {workouts.map((workout) => (
                <Link key={workout.id} href={`/dashboard/workout/${workout.id}`}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {workout.name ?? format(workout.startedAt, "do MMM yyyy")}
                      </CardTitle>
                    </CardHeader>
                    {workout.exercises.length > 0 && (
                      <CardContent>
                        <ul className="flex flex-col gap-2">
                          {workout.exercises.map((exercise) => (
                            <li key={exercise.id}>
                              <p className="text-sm font-medium">{exercise.name}</p>
                              <ul className="mt-1 flex flex-col gap-0.5">
                                {exercise.sets.map((set) => (
                                  <li key={set.setNumber} className="text-sm text-muted-foreground">
                                    Set {set.setNumber}: {set.reps} reps &mdash; {set.weight} kg
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right panel — graph cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MonthlyWorkoutChart data={monthlyCounts} year={currentYear} />
          <VolumeTrendChart
            data={volumeByMonth}
            year={currentYear}
            exerciseList={exerciseList}
            selectedExercise={selectedExercise}
          />
          <StreakCard current={streak.current} longest={streak.longest} />
          <TopExercisesChart data={topExercises} />
        </div>

      </div>
    </main>
  );
}

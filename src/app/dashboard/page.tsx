import { WorkoutDatePicker } from "./_components/WorkoutDatePicker";

export default function DashboardPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <WorkoutDatePicker />
    </main>
  );
}

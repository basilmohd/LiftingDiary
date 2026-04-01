import { NewWorkoutForm } from "./_components/NewWorkoutForm";

export default function NewWorkoutPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">New Workout</h2>
      <NewWorkoutForm />
    </main>
  );
}

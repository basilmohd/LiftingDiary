"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createWorkout } from "@/app/dashboard/actions";

type SetState = { reps: string; weight: string };
type ExerciseState = { name: string; sets: SetState[] };
type FormState = { name: string; startedAt: string; exercises: ExerciseState[] };

function defaultForm(): FormState {
  return {
    name: "",
    startedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    exercises: [{ name: "", sets: [{ reps: "", weight: "" }] }],
  };
}

export function NewWorkoutForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function updateExerciseName(i: number, name: string) {
    setForm((prev) => {
      const exercises = [...prev.exercises];
      exercises[i] = { ...exercises[i], name };
      return { ...prev, exercises };
    });
  }

  function updateSet(i: number, j: number, field: keyof SetState, value: string) {
    setForm((prev) => {
      const exercises = [...prev.exercises];
      const sets = [...exercises[i].sets];
      sets[j] = { ...sets[j], [field]: value };
      exercises[i] = { ...exercises[i], sets };
      return { ...prev, exercises };
    });
  }

  function addExercise() {
    setForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { name: "", sets: [{ reps: "", weight: "" }] }],
    }));
  }

  function removeExercise(i: number) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, idx) => idx !== i),
    }));
  }

  function addSet(i: number) {
    setForm((prev) => {
      const exercises = [...prev.exercises];
      exercises[i] = { ...exercises[i], sets: [...exercises[i].sets, { reps: "", weight: "" }] };
      return { ...prev, exercises };
    });
  }

  function removeSet(i: number, j: number) {
    setForm((prev) => {
      const exercises = [...prev.exercises];
      exercises[i] = { ...exercises[i], sets: exercises[i].sets.filter((_, idx) => idx !== j) };
      return { ...prev, exercises };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await createWorkout({
      name: form.name,
      startedAt: new Date(form.startedAt).toISOString(),
      exercises: form.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets.map((s) => ({
          reps: parseInt(s.reps, 10),
          weight: parseFloat(s.weight),
        })),
      })),
    });

    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Workout</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workout-name">Workout name (optional)</Label>
            <Input
              id="workout-name"
              placeholder="e.g. Monday Push"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="started-at">Date &amp; time</Label>
            <Input
              id="started-at"
              type="datetime-local"
              value={form.startedAt}
              onChange={(e) => setForm((prev) => ({ ...prev, startedAt: e.target.value }))}
              required
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-6">
            {form.exercises.map((exercise, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Label htmlFor={`exercise-name-${i}`}>Exercise {i + 1}</Label>
                    <Input
                      id={`exercise-name-${i}`}
                      placeholder="e.g. Bench Press"
                      value={exercise.name}
                      onChange={(e) => updateExerciseName(i, e.target.value)}
                      required
                    />
                  </div>
                  {form.exercises.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-5 text-muted-foreground"
                      onClick={() => removeExercise(i)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-2 pl-2">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted-foreground font-medium px-1">
                    <span>Reps</span>
                    <span>Weight (kg)</span>
                    <span />
                  </div>
                  {exercise.sets.map((set, j) => (
                    <div key={j} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <Input
                        type="number"
                        min={1}
                        placeholder="0"
                        value={set.reps}
                        onChange={(e) => updateSet(i, j, "reps", e.target.value)}
                        required
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        placeholder="0"
                        value={set.weight}
                        onChange={(e) => updateSet(i, j, "weight", e.target.value)}
                        required
                      />
                      {exercise.sets.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => removeSet(i, j)}
                        >
                          &times;
                        </Button>
                      ) : (
                        <div className="w-9" />
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => addSet(i)}
                  >
                    + Add set
                  </Button>
                </div>

                {i < form.exercises.length - 1 && <Separator />}
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addExercise}>
            + Add exercise
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save workout"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

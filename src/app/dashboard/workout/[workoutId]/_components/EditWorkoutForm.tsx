"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateWorkoutAction } from "@/app/dashboard/workout/[workoutId]/actions";
import type { WorkoutDetail } from "@/data/workouts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SetState =
  | { mode: "saved"; reps: string; weight: string }
  | { mode: "editing"; reps: string; weight: string };

type PendingSet = { reps: string; weight: string };

type ExerciseState = {
  name: string;
  sets: SetState[];
  pending: PendingSet;
};

type FormState = {
  name: string;
  exercises: ExerciseState[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toFormState(workout: WorkoutDetail): FormState {
  return {
    name: workout.name ?? "",
    exercises:
      workout.exercises.length > 0
        ? workout.exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets.map((s) => ({
              mode: "saved" as const,
              reps: String(s.reps),
              weight: s.weight,
            })),
            pending: { reps: "", weight: "" },
          }))
        : [],
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditWorkoutForm({
  workout,
  availableExercises,
}: {
  workout: WorkoutDetail;
  dateLabel: string;
  availableExercises: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(workout));
  const [selectedExercise, setSelectedExercise] = useState("");
  const [exerciseInput, setExerciseInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // ── Exercise management ─────────────────────────────────────────────────

  function addExercise() {
    const name = exerciseInput.trim();
    if (!name) return;
    setForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { name, sets: [], pending: { reps: "", weight: "" } },
      ],
    }));
    setExerciseInput("");
    setSelectedExercise("");
  }

  function removeExercise(i: number) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, idx) => idx !== i),
    }));
  }

  // ── Set management ──────────────────────────────────────────────────────

  function updatePending(i: number, field: keyof PendingSet, value: string) {
    setForm((prev) => {
      const exercises = [...prev.exercises];
      exercises[i] = { ...exercises[i], pending: { ...exercises[i].pending, [field]: value } };
      return { ...prev, exercises };
    });
  }

  function commitPendingSet(i: number) {
    const ex = form.exercises[i];
    if (!ex.pending.reps || !ex.pending.weight) return;
    setForm((prev) => {
      const exercises = [...prev.exercises];
      exercises[i] = {
        ...exercises[i],
        sets: [...exercises[i].sets, { mode: "saved", reps: ex.pending.reps, weight: ex.pending.weight }],
        pending: { reps: "", weight: "" },
      };
      return { ...prev, exercises };
    });
  }

  function startEditSet(i: number, j: number) {
    setForm((prev) => {
      const exercises = [...prev.exercises];
      const sets = [...exercises[i].sets];
      sets[j] = { ...sets[j], mode: "editing" };
      exercises[i] = { ...exercises[i], sets };
      return { ...prev, exercises };
    });
  }

  function updateEditingSet(i: number, j: number, field: "reps" | "weight", value: string) {
    setForm((prev) => {
      const exercises = [...prev.exercises];
      const sets = [...exercises[i].sets];
      sets[j] = { ...sets[j], [field]: value };
      exercises[i] = { ...exercises[i], sets };
      return { ...prev, exercises };
    });
  }

  function saveEditSet(i: number, j: number) {
    setForm((prev) => {
      const exercises = [...prev.exercises];
      const sets = [...exercises[i].sets];
      sets[j] = { ...sets[j], mode: "saved" };
      exercises[i] = { ...exercises[i], sets };
      return { ...prev, exercises };
    });
  }

  function cancelEditSet(i: number, j: number) {
    // Revert to saved mode with original values from workout if available
    const original = workout.exercises[i]?.sets[j];
    setForm((prev) => {
      const exercises = [...prev.exercises];
      const sets = [...exercises[i].sets];
      sets[j] = {
        mode: "saved",
        reps: original ? String(original.reps) : sets[j].reps,
        weight: original ? original.weight : sets[j].weight,
      };
      exercises[i] = { ...exercises[i], sets };
      return { ...prev, exercises };
    });
  }

  function deleteSet(i: number, j: number) {
    setForm((prev) => {
      const exercises = [...prev.exercises];
      exercises[i] = { ...exercises[i], sets: exercises[i].sets.filter((_, idx) => idx !== j) };
      return { ...prev, exercises };
    });
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.exercises.length === 0) {
      setError("Add at least one exercise.");
      return;
    }

    const exercises = form.exercises.map((ex) => {
      // Include editing rows as-is; include non-empty pending row
      const allSets = [
        ...ex.sets,
        ...(ex.pending.reps && ex.pending.weight
          ? [{ mode: "saved" as const, reps: ex.pending.reps, weight: ex.pending.weight }]
          : []),
      ];
      return {
        name: ex.name,
        sets: allSets.map((s) => ({
          reps: parseInt(s.reps, 10),
          weight: parseFloat(s.weight),
        })),
      };
    });

    for (const ex of exercises) {
      if (ex.sets.length === 0) {
        setError(`"${ex.name}" needs at least one set.`);
        return;
      }
    }

    setPending(true);
    const result = await updateWorkoutAction({
      workoutId: workout.id,
      name: form.name,
      startedAt: workout.startedAt.toISOString(),
      exercises,
    });
    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/dashboard?date=${format(workout.startedAt, "yyyy-MM-dd")}`);
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Workout name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workout-name">Workout name (optional)</Label>
        <Input
          id="workout-name"
          placeholder="e.g. Monday Push"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <Separator />

      {/* Exercise tables */}
      {form.exercises.length > 0 && (
        <div className="flex flex-col gap-6">
          {form.exercises.map((exercise, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{exercise.name}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => removeExercise(i)}
                  >
                    Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Set</TableHead>
                      <TableHead>Reps</TableHead>
                      <TableHead>Weight (kg)</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Saved / editing rows */}
                    {exercise.sets.map((set, j) =>
                      set.mode === "editing" ? (
                        <TableRow key={j}>
                          <TableCell className="text-muted-foreground">{j + 1}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              className="h-8 w-20"
                              value={set.reps}
                              onChange={(e) => updateEditingSet(i, j, "reps", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step="0.5"
                              className="h-8 w-24"
                              value={set.weight}
                              onChange={(e) => updateEditingSet(i, j, "weight", e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => saveEditSet(i, j)}
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelEditSet(i, j)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={j}>
                          <TableCell className="text-muted-foreground">{j + 1}</TableCell>
                          <TableCell>{set.reps}</TableCell>
                          <TableCell>{set.weight}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditSet(i, j)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteSet(i, j)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    )}

                    {/* Pending row */}
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        {exercise.sets.length + 1}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          placeholder="0"
                          className="h-8 w-20"
                          value={exercise.pending.reps}
                          onChange={(e) => updatePending(i, "reps", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.5"
                          placeholder="0"
                          className="h-8 w-24"
                          value={exercise.pending.weight}
                          onChange={(e) => updatePending(i, "weight", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => commitPendingSet(i)}
                        >
                          Add Set
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* Add exercise */}
      <div className="flex flex-col gap-2">
        <Label>Add Exercise</Label>
        <div className="flex gap-2 flex-wrap">
          {availableExercises.length > 0 && (
            <Select
              value={selectedExercise}
              onValueChange={(val) => {
                setSelectedExercise(val);
                setExerciseInput(val);
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select existing…" />
              </SelectTrigger>
              <SelectContent>
                {availableExercises.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            placeholder="or type a new exercise"
            className="w-52"
            value={exerciseInput}
            onChange={(e) => {
              setExerciseInput(e.target.value);
              setSelectedExercise("");
            }}
          />
          <Button type="button" variant="outline" onClick={addExercise}>
            Add Exercise
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}

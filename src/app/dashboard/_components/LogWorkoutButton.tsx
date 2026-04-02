"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { createEmptyWorkout } from "../actions";

type Props = {
  date: Date;
};

export function LogWorkoutButton({ date }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await createEmptyWorkout(format(date, "yyyy-MM-dd'T'HH:mm"));
    setPending(false);

    if (result.success) {
      router.push(`/dashboard/workout/${result.workoutId}?date=${format(date, "yyyy-MM-dd")}`);
    }
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? "Creating..." : "Log New Workout"}
    </Button>
  );
}

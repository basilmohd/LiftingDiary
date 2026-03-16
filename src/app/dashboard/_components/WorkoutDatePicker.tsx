"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Placeholder workout type — replace with real type once data layer exists
type Workout = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

// Stub data for UI development
const STUB_WORKOUTS: Workout[] = [
  { id: "1", name: "Bench Press", sets: 4, reps: 8, weight: 100 },
  { id: "2", name: "Squat", sets: 5, reps: 5, weight: 140 },
  { id: "3", name: "Deadlift", sets: 3, reps: 5, weight: 180 },
];

export function WorkoutDatePicker() {
  const [date, setDate] = useState<Date>(new Date());

  // Stub: always show workouts for today, empty for other dates
  const workouts =
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
      ? STUB_WORKOUTS
      : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Date</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-48 justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "do MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {workouts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No workouts logged for this date.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map((workout) => (
            <Card key={workout.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{workout.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {workout.sets} sets &times; {workout.reps} reps &mdash; {workout.weight} kg
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

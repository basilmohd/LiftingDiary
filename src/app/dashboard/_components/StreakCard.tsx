import { Flame } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  current: number;
  longest: number;
};

export function StreakCard({ current, longest }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Workout Streak
        </CardTitle>
        <CardDescription>Consecutive days with at least one workout</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-bold">{current}</p>
            <p className="text-sm text-muted-foreground">Current streak</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{longest}</p>
            <p className="text-sm text-muted-foreground">Longest streak</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { SignInButton, SignUpButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-foreground">
        Track Your Lifts.
      </h1>
      <p className="text-lg text-muted-foreground">
        Log every rep, every set.
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        Lifting Diary helps you track your weightlifting workouts — log exercises, sets, and reps, monitor your progress over time, and stay consistent with your training.
      </p>
      <div className="flex gap-3">
        <Show when="signed-out">
          <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
            <Button className="cursor-pointer">Get Started</Button>
          </SignUpButton>
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <Button variant="outline" className="cursor-pointer">Sign In</Button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </Show>
      </div>
    </main>
  );
}

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './index';
import { exercises } from './schema';

const EXERCISES = [
  // Chest
  { name: 'Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Bench Press', muscleGroup: 'Chest' },
  { name: 'Decline Bench Press', muscleGroup: 'Chest' },
  { name: 'Dumbbell Flyes', muscleGroup: 'Chest' },
  { name: 'Cable Crossover', muscleGroup: 'Chest' },
  { name: 'Push-Up', muscleGroup: 'Chest' },
  { name: 'Chest Dips', muscleGroup: 'Chest' },

  // Back
  { name: 'Deadlift', muscleGroup: 'Back' },
  { name: 'Pull-Up', muscleGroup: 'Back' },
  { name: 'Chin-Up', muscleGroup: 'Back' },
  { name: 'Barbell Row', muscleGroup: 'Back' },
  { name: 'Dumbbell Row', muscleGroup: 'Back' },
  { name: 'Lat Pulldown', muscleGroup: 'Back' },
  { name: 'Seated Cable Row', muscleGroup: 'Back' },
  { name: 'T-Bar Row', muscleGroup: 'Back' },
  { name: 'Face Pull', muscleGroup: 'Back' },

  // Legs
  { name: 'Squat', muscleGroup: 'Legs' },
  { name: 'Leg Press', muscleGroup: 'Legs' },
  { name: 'Romanian Deadlift', muscleGroup: 'Legs' },
  { name: 'Lunges', muscleGroup: 'Legs' },
  { name: 'Leg Curl', muscleGroup: 'Legs' },
  { name: 'Leg Extension', muscleGroup: 'Legs' },
  { name: 'Calf Raise', muscleGroup: 'Legs' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Legs' },
  { name: 'Hack Squat', muscleGroup: 'Legs' },
  { name: 'Sumo Deadlift', muscleGroup: 'Legs' },

  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders' },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { name: 'Front Raise', muscleGroup: 'Shoulders' },
  { name: 'Rear Delt Fly', muscleGroup: 'Shoulders' },
  { name: 'Arnold Press', muscleGroup: 'Shoulders' },
  { name: 'Upright Row', muscleGroup: 'Shoulders' },
  { name: 'Cable Lateral Raise', muscleGroup: 'Shoulders' },

  // Biceps
  { name: 'Barbell Curl', muscleGroup: 'Biceps' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps' },
  { name: 'Hammer Curl', muscleGroup: 'Biceps' },
  { name: 'Preacher Curl', muscleGroup: 'Biceps' },
  { name: 'Cable Curl', muscleGroup: 'Biceps' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps' },
  { name: 'Concentration Curl', muscleGroup: 'Biceps' },

  // Triceps
  { name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
  { name: 'Skull Crusher', muscleGroup: 'Triceps' },
  { name: 'Close Grip Bench Press', muscleGroup: 'Triceps' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps' },
  { name: 'Tricep Dips', muscleGroup: 'Triceps' },
  { name: 'Diamond Push-Up', muscleGroup: 'Triceps' },
  { name: 'Cable Tricep Kickback', muscleGroup: 'Triceps' },

  // Core
  { name: 'Plank', muscleGroup: 'Core' },
  { name: 'Crunch', muscleGroup: 'Core' },
  { name: 'Leg Raise', muscleGroup: 'Core' },
  { name: 'Russian Twist', muscleGroup: 'Core' },
  { name: 'Cable Crunch', muscleGroup: 'Core' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Core' },
  { name: 'Hanging Leg Raise', muscleGroup: 'Core' },
  { name: 'Side Plank', muscleGroup: 'Core' },

  // Glutes
  { name: 'Hip Thrust', muscleGroup: 'Glutes' },
  { name: 'Glute Bridge', muscleGroup: 'Glutes' },
  { name: 'Cable Kickback', muscleGroup: 'Glutes' },
  { name: 'Step-Up', muscleGroup: 'Glutes' },
];

async function seed() {
  // Full clean slate: workouts cascade → workout_exercises + sets, then exercises
  // await db.execute(sql`TRUNCATE workouts CASCADE`);
  // await db.execute(sql`TRUNCATE exercises`);
  await db.insert(exercises).values(EXERCISES);
  console.log(`Seeded ${EXERCISES.length} exercises.`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

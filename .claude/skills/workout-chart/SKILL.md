---
name: workout-chart
description: Generate a bar chart image showing workout sessions per month over the last year, queried directly from the project's PostgreSQL database. Use this skill whenever the user asks to visualize workout frequency, plot workout history, chart sessions by month, or see how often they've been working out over time. Trigger even if the user says things like "show me my progress", "how consistent have I been", or "chart my workouts".
---

# Workout Chart Skill

Queries the `workouts` table for the last 12 calendar months and produces a bar chart PNG — x-axis is month, y-axis is number of completed sessions.

## Steps

### 1. Find the DATABASE_URL

Read the `.env` file in the project root. Extract the value of `DATABASE_URL`.

If the file doesn't exist or the variable is missing, tell the user and stop.

### 2. Install dependencies (if needed)

Check whether the required Python packages are available:

```bash
python -c "import psycopg2, matplotlib, dateutil" 2>&1
```

If any are missing, install them:

```bash
pip install psycopg2-binary matplotlib python-dateutil
```

### 3. Run the bundled script

The script lives at `scripts/plot_workouts.py` relative to this skill's directory.
Resolve its absolute path and run:

```bash
python <skill-dir>/scripts/plot_workouts.py \
  --database-url "<DATABASE_URL>" \
  --output workouts_chart.png
```

The output image is written to `workouts_chart.png` in the current working directory (the project root).

### 4. Confirm to the user

Tell the user the chart was saved and where: e.g., `workouts_chart.png` in the project root. If the total session count printed by the script is zero, mention that no workout data was found for the last 12 months (they may need to log some sessions first).

## Notes

- The script counts rows in `workouts` where `started_at` falls within the last 12 months. It does NOT filter by `userId` — the chart reflects all users in the database. If the user wants per-user filtering, ask for their Clerk user ID and pass it as an additional flag (the script would need a minor edit to add a `WHERE user_id = %s` clause).
- The chart is exported at 150 dpi as a PNG. The output path can be changed with `--output`.
- If the database connection fails (SSL, firewall, wrong URL), show the raw error to the user — don't swallow it.

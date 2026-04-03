"""
plot_workouts.py — Query workout sessions from the last 12 months and plot a bar chart.

Usage:
    python plot_workouts.py --database-url <DATABASE_URL> [--output workouts_chart.png]

Requires: psycopg2-binary, matplotlib
"""

import argparse
import sys
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

try:
    import psycopg2
except ImportError:
    sys.exit("Missing dependency: pip install psycopg2-binary")

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.ticker as ticker
except ImportError:
    sys.exit("Missing dependency: pip install matplotlib")

try:
    from dateutil.relativedelta import relativedelta
except ImportError:
    sys.exit("Missing dependency: pip install python-dateutil")


def query_monthly_counts(database_url: str) -> list[tuple[str, int]]:
    """Return a list of (label, count) tuples for the last 12 calendar months."""
    now = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start = now - relativedelta(months=11)  # 12 months including current

    sql = """
        SELECT
            DATE_TRUNC('month', started_at) AS month,
            COUNT(*) AS sessions
        FROM workouts
        WHERE started_at >= %s
          AND started_at < %s
        GROUP BY 1
        ORDER BY 1;
    """

    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(sql, (start, now + relativedelta(months=1)))
            rows = {row[0].replace(tzinfo=timezone.utc): row[1] for row in cur.fetchall()}
    finally:
        conn.close()

    # Fill in months with zero sessions so the axis is continuous
    result = []
    for i in range(12):
        month_dt = start + relativedelta(months=i)
        label = month_dt.strftime("%b %Y")
        count = rows.get(month_dt, 0)
        result.append((label, count))

    return result


def plot_chart(data: list[tuple[str, int]], output_path: str) -> None:
    labels = [d[0] for d in data]
    counts = [d[1] for d in data]

    fig, ax = plt.subplots(figsize=(12, 6))

    bars = ax.bar(labels, counts, color="#4f86c6", edgecolor="white", linewidth=0.6)

    # Annotate bar tops
    for bar, count in zip(bars, counts):
        if count > 0:
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.1,
                str(count),
                ha="center",
                va="bottom",
                fontsize=10,
                fontweight="bold",
                color="#333333",
            )

    ax.set_xlabel("Month", fontsize=12, labelpad=10)
    ax.set_ylabel("Workout Sessions", fontsize=12, labelpad=10)
    ax.set_title("Workout Sessions — Last 12 Months", fontsize=14, fontweight="bold", pad=16)
    ax.yaxis.set_major_locator(ticker.MaxNLocator(integer=True))
    ax.set_ylim(0, max(counts, default=1) * 1.25 + 1)
    ax.spines[["top", "right"]].set_visible(False)
    ax.tick_params(axis="x", rotation=45)
    ax.grid(axis="y", linestyle="--", alpha=0.4)

    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    print(f"Chart saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Plot workout sessions per month.")
    parser.add_argument("--database-url", required=True, help="PostgreSQL connection string")
    parser.add_argument("--output", default="workouts_chart.png", help="Output image path")
    args = parser.parse_args()

    print("Querying database...")
    data = query_monthly_counts(args.database_url)
    total = sum(c for _, c in data)
    print(f"Found {total} workout sessions across the last 12 months.")

    plot_chart(data, args.output)


if __name__ == "__main__":
    main()

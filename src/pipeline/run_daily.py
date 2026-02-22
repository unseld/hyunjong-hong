"""Orchestrates daily collection + diagnostics + alerts for MVP."""

from __future__ import annotations

import argparse
import subprocess


def run(cmd: str) -> None:
    print(f"[RUN] {cmd}")
    subprocess.run(cmd, shell=True, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--goal", default="purchase", choices=["follow", "signup", "purchase"])
    parser.add_argument("--date-preset", default="yesterday")
    parser.add_argument("--input-csv", default="data/sample_insights.csv")
    parser.add_argument("--channel", default="stdout", choices=["stdout", "slack", "email"])
    args = parser.parse_args()

    run(
        "python -m src.collector.meta_insights_collector "
        f"--date-preset {args.date_preset} --output data/insights_latest.csv --input-csv {args.input_csv}"
    )
    run(
        "python -m src.alerts.alert_runner "
        f"--goal {args.goal} --input data/insights_latest.csv --channel {args.channel} --output data/alerts_latest.json"
    )


if __name__ == "__main__":
    main()

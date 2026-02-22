"""Daily alert runner with pluggable channels (stdout/slack/email placeholders)."""

from __future__ import annotations

import argparse
import json
import os
import urllib.request
from pathlib import Path
from typing import Any

from src.diagnostics.diagnostic_engine import read_csv_rows, run_diagnostics


def send_stdout(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def send_slack(payload: dict[str, Any]) -> None:
    webhook = os.getenv("SLACK_WEBHOOK_URL")
    if not webhook:
        print("[WARN] SLACK_WEBHOOK_URL missing; fallback to stdout")
        send_stdout(payload)
        return

    data = json.dumps({"text": json.dumps(payload, ensure_ascii=False, indent=2)}).encode("utf-8")
    req = urllib.request.Request(webhook, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15):
        pass


def send_email(payload: dict[str, Any]) -> None:
    print("[TODO] connect SMTP provider", json.dumps(payload, ensure_ascii=False))


CHANNEL_MAP = {
    "stdout": send_stdout,
    "slack": send_slack,
    "email": send_email,
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--goal", required=True, choices=["follow", "signup", "purchase"])
    parser.add_argument("--input", default="data/insights_latest.csv")
    parser.add_argument("--channel", default="stdout", choices=list(CHANNEL_MAP.keys()))
    parser.add_argument("--output", default="data/alerts_latest.json")
    args = parser.parse_args()

    rows = read_csv_rows(args.input)
    result = run_diagnostics(rows, goal=args.goal)

    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    CHANNEL_MAP[args.channel](result)


if __name__ == "__main__":
    main()

"""Meta Marketing API Insights collector (stdlib-only)."""

from __future__ import annotations

import argparse
import csv
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

API_VERSION = "v20.0"
BASE_URL = f"https://graph.facebook.com/{API_VERSION}"
FIELDS = [
    "date_start",
    "date_stop",
    "campaign_name",
    "adset_name",
    "ad_name",
    "spend",
    "reach",
    "impressions",
    "frequency",
    "clicks",
    "ctr",
    "cpc",
    "actions",
    "action_values",
    "purchase_roas",
    "publisher_platform",
    "platform_position",
    "age",
    "gender",
    "region",
]


def _extract_actions(row: dict[str, Any]) -> dict[str, float]:
    action_map: dict[str, float] = {}
    for item in row.get("actions", []) or []:
        action_map[item.get("action_type", "unknown")] = float(item.get("value", 0))
    for item in row.get("action_values", []) or []:
        key = f"value_{item.get('action_type', 'unknown')}"
        action_map[key] = float(item.get("value", 0))
    return action_map


def _api_get(url: str, params: dict[str, Any]) -> dict[str, Any]:
    query = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{url}?{query}")
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_insights(date_preset: str, level: str = "ad") -> list[dict[str, Any]]:
    token = os.getenv("META_ACCESS_TOKEN")
    account_id = os.getenv("META_AD_ACCOUNT_ID")
    if not token or not account_id:
        raise RuntimeError("META_ACCESS_TOKEN or META_AD_ACCOUNT_ID is missing")

    url = f"{BASE_URL}/act_{account_id}/insights"
    params = {
        "access_token": token,
        "fields": ",".join(FIELDS),
        "date_preset": date_preset,
        "level": level,
        "breakdowns": "publisher_platform,platform_position,age,gender,region",
        "limit": 500,
    }

    rows: list[dict[str, Any]] = []
    while True:
        payload = _api_get(url, params)

        for item in payload.get("data", []):
            actions = _extract_actions(item)
            rows.append({
                **item,
                **actions,
                "link_clicks": actions.get("link_click", 0),
                "landing_page_views": actions.get("landing_page_view", 0),
                "signups": actions.get("complete_registration", 0),
                "purchases": actions.get("purchase", 0),
                "purchase_value": actions.get("value_purchase", 0),
                "profile_visits": actions.get("onsite_conversion.profile_visit", 0),
                "follows": actions.get("onsite_conversion.follow", 0),
            })

        next_url = payload.get("paging", {}).get("next")
        if not next_url:
            break
        url = next_url
        params = {}

    return rows


def write_csv(rows: list[dict[str, Any]], output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = sorted({k for row in rows for k in row.keys()})
    with output_file.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch Meta insights")
    parser.add_argument("--date-preset", default="yesterday")
    parser.add_argument("--level", default="ad", choices=["campaign", "adset", "ad"])
    parser.add_argument("--output", default="data/insights_latest.csv")
    parser.add_argument("--input-csv", help="Fallback local CSV if API credentials are not available")
    args = parser.parse_args()

    try:
        rows = fetch_insights(date_preset=args.date_preset, level=args.level)
    except Exception as exc:
        if not args.input_csv:
            raise
        print(f"[WARN] API fetch failed ({exc}), using fallback CSV: {args.input_csv}")
        with open(args.input_csv, "r", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))

    write_csv(rows, Path(args.output))
    print(json.dumps({"rows": len(rows), "output": args.output}, ensure_ascii=False))


if __name__ == "__main__":
    main()

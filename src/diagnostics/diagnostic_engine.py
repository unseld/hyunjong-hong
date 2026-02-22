"""Goal-based diagnostic engine using JSON config rules (stdlib-only)."""

from __future__ import annotations

import ast
import csv
import json
from dataclasses import dataclass
from pathlib import Path
from statistics import mean
from typing import Any

SAFE_NODES = {
    ast.Expression,
    ast.BoolOp,
    ast.BinOp,
    ast.UnaryOp,
    ast.Compare,
    ast.Name,
    ast.Load,
    ast.Constant,
    ast.And,
    ast.Or,
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.Mod,
    ast.Pow,
    ast.USub,
    ast.Gt,
    ast.GtE,
    ast.Lt,
    ast.LtE,
    ast.Eq,
    ast.NotEq,
}


@dataclass
class DiagnosticResult:
    rule_id: str
    root_cause: str
    action: str


def _safe_eval(expression: str, context: dict[str, float]) -> bool:
    tree = ast.parse(expression, mode="eval")
    for node in ast.walk(tree):
        if type(node) not in SAFE_NODES:
            raise ValueError(f"Unsafe expression node: {type(node).__name__}")
    return bool(eval(compile(tree, "<expr>", "eval"), {}, context))


def _to_float(value: Any) -> float:
    try:
        return float(value)
    except Exception:
        return 0.0


def read_csv_rows(path: str) -> list[dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _enrich_row(row: dict[str, Any]) -> dict[str, float]:
    spend = _to_float(row.get("spend", 0))
    purchases = _to_float(row.get("purchases", 0))
    signups = _to_float(row.get("signups", 0))
    clicks = _to_float(row.get("link_clicks", row.get("clicks", 0)))
    return {
        "ctr": _to_float(row.get("ctr", 0)),
        "cpc": _to_float(row.get("cpc", 0)),
        "frequency": _to_float(row.get("frequency", 0)),
        "cvr": purchases / max(clicks, 1),
        "cpa_purchase": spend / max(purchases, 1),
        "cpa_signup": spend / max(signups, 1),
    }


def build_context(rows: list[dict[str, Any]]) -> dict[str, float]:
    latest = rows[-1]
    context = {k: _to_float(v) for k, v in latest.items()}
    context.update(_enrich_row(latest))

    window = rows[-7:]
    for metric in ["ctr", "cpc", "cvr", "frequency", "cpa_purchase", "cpa_signup"]:
        values = [_enrich_row(r).get(metric, 0.0) for r in window]
        if any(values):
            context[f"rolling_7d_{metric}"] = mean(values)

    spend_total = sum(_to_float(r.get("spend", 0)) for r in rows)
    reels_rows = [r for r in rows if "reels" in str(r.get("platform_position", "")).lower()]
    feed_rows = [r for r in rows if "feed" in str(r.get("platform_position", "")).lower()]

    reels_spend = sum(_to_float(r.get("spend", 0)) for r in reels_rows)
    reels_purchases = sum(_to_float(r.get("purchases", 0)) for r in reels_rows)
    feed_spend = sum(_to_float(r.get("spend", 0)) for r in feed_rows)
    feed_purchases = sum(_to_float(r.get("purchases", 0)) for r in feed_rows)

    context["reels_cpa"] = reels_spend / max(reels_purchases, 1)
    context["feed_cpa"] = feed_spend / max(feed_purchases, 1)
    context["reels_spend_share"] = reels_spend / max(spend_total, 1)

    return context


def apply_derived_metrics(context: dict[str, float], derived_metrics: dict[str, str]) -> None:
    for metric_name, expression in derived_metrics.items():
        context[metric_name] = _to_float(eval(expression, {"max": max}, context))


def run_diagnostics(rows: list[dict[str, Any]], goal: str, goals_config_path: str = "config/goals.json") -> dict[str, Any]:
    config = json.loads(Path(goals_config_path).read_text(encoding="utf-8"))
    goal_config = config["goals"][goal]

    context = build_context(rows)
    context.update(goal_config.get("thresholds", {}))
    apply_derived_metrics(context, goal_config.get("derived_metrics", {}))

    findings: list[DiagnosticResult] = []
    for rule in goal_config.get("diagnostic_rules", []):
        if _safe_eval(rule["when"], context):
            findings.append(
                DiagnosticResult(
                    rule_id=rule["id"],
                    root_cause=rule["root_cause"],
                    action=rule["action_template"],
                )
            )

    alerts = []
    for alert in config.get("global_alerts", []):
        if _safe_eval(alert["when"], context):
            alerts.append(alert)

    return {
        "goal": goal,
        "context": context,
        "findings": [f.__dict__ for f in findings],
        "alerts": alerts,
    }

#!/usr/bin/env python3
"""
Generate a lightweight HTML/SVG entity theme report from a CSV export of SERP_Results.

Usage:
  python3 scripts/generate_entity_report.py data/serp_results.csv assets/entity-report.html
"""

from __future__ import annotations

import csv
import html
import os
import sys
from collections import Counter


def load_rows(path: str) -> list[dict[str, str]]:
    with open(path, "r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def top_entities(rows: list[dict[str, str]], limit: int = 8) -> list[tuple[str, int]]:
    counts: Counter[str] = Counter()
    for row in rows:
      for chunk in (row.get("top_entities") or "").split(","):
            token = chunk.strip()
            if token:
                counts[token] += 1
    return counts.most_common(limit)


def theme_counts(rows: list[dict[str, str]]) -> list[tuple[str, int]]:
    counts: Counter[str] = Counter()
    for row in rows:
        theme = (row.get("entity_theme") or "general").strip() or "general"
        counts[theme] += 1
    return counts.most_common()


def entity_count_summary(rows: list[dict[str, str]]) -> dict[str, float]:
    values = []
    for row in rows:
        raw = (row.get("entity_count") or row.get("token_count") or "").strip()
        if raw.isdigit():
            values.append(int(raw))
    if not values:
        return {"avg": 0.0, "max": 0, "min": 0}
    return {
        "avg": round(sum(values) / len(values), 2),
        "max": max(values),
        "min": min(values),
    }


def bar_svg(data: list[tuple[str, int]], width: int = 720) -> str:
    if not data:
        return "<p>No chart data.</p>"
    bar_height = 34
    gap = 14
    total_height = len(data) * (bar_height + gap) + 20
    max_value = max(value for _, value in data) or 1
    rows = []
    for index, (label, value) in enumerate(data):
        y = 10 + index * (bar_height + gap)
        bar_width = int((value / max_value) * (width - 240))
        rows.append(
            f'<text x="0" y="{y + 22}" font-size="14" fill="#111827">{html.escape(label)}</text>'
            f'<rect x="220" y="{y}" rx="8" ry="8" width="{bar_width}" height="{bar_height}" fill="#2563eb"></rect>'
            f'<text x="{230 + bar_width}" y="{y + 22}" font-size="14" fill="#111827">{value}</text>'
        )
    return (
        f'<svg viewBox="0 0 {width} {total_height}" width="100%" xmlns="http://www.w3.org/2000/svg">'
        + "".join(rows)
        + "</svg>"
    )


def render_report(rows: list[dict[str, str]]) -> str:
    themes = theme_counts(rows)
    entities = top_entities(rows)
    summary = entity_count_summary(rows)
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>SEO MVP Entity Report</title>
    <style>
      body {{ font-family: Arial, sans-serif; margin: 40px; color: #111827; background: #f8fafc; }}
      .card {{ background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08); }}
      h1, h2 {{ margin-top: 0; }}
      .stats {{ display: flex; gap: 20px; flex-wrap: wrap; }}
      .stat {{ min-width: 140px; }}
      code {{ background: #e2e8f0; padding: 2px 6px; border-radius: 6px; }}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>SEO Automation MVP Entity Report</h1>
      <p>Generated from a CSV export of <code>SERP_Results</code>.</p>
      <div class="stats">
        <div class="stat"><strong>Total rows</strong><br>{len(rows)}</div>
        <div class="stat"><strong>Avg entity count</strong><br>{summary["avg"]}</div>
        <div class="stat"><strong>Max entity count</strong><br>{summary["max"]}</div>
        <div class="stat"><strong>Min entity count</strong><br>{summary["min"]}</div>
      </div>
    </div>
    <div class="card">
      <h2>Entity Theme Groups</h2>
      {bar_svg(themes)}
    </div>
    <div class="card">
      <h2>Most Repeated Top Entities</h2>
      {bar_svg(entities)}
    </div>
  </body>
</html>"""


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python3 scripts/generate_entity_report.py <input.csv> <output.html>")
        return 1
    input_path, output_path = sys.argv[1], sys.argv[2]
    rows = load_rows(input_path)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as handle:
        handle.write(render_report(rows))
    print(f"Wrote report to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

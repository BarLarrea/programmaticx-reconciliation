#!/usr/bin/env python3
"""Pull partner reports, load them next to the server CSV, and print daily gaps.

Requires the mock API to be running (see README).
"""

from __future__ import annotations

import csv
import json
import sqlite3
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

API_BASE = "http://127.0.0.1:8000"
ROOT = Path(__file__).resolve().parent
SERVER_CSV = ROOT / "data" / "server_revenue.csv"
RAW_DIR = ROOT / "raw"
DB_PATH = ROOT / "reconcile.db"
THRESHOLD = 0.10


def date_from_timestamp(timestamp: str) -> str:
    dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    local = dt.astimezone(ZoneInfo("Asia/Jerusalem"))
    return local.date().isoformat()


def each_date(start: str, end: str) -> list[str]:
    days = []
    current = date.fromisoformat(start)
    last = date.fromisoformat(end)
    while current <= last:
        days.append(current.isoformat())
        current += timedelta(days=1)
    return days


def fetch_report(day: str) -> dict:
    url = f"{API_BASE}/report?date={day}"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            body = resp.read()
    except urllib.error.URLError as exc:
        sys.exit(
            f"Could not reach the mock API at {API_BASE}. "
            f"Start it first with: python mock_api/server.py\n({exc})"
        )
    RAW_DIR.mkdir(exist_ok=True)
    (RAW_DIR / f"report_{day}.json").write_bytes(body)
    return json.loads(body.decode("utf-8"))


def load_server_dates() -> list[str]:
    days = []
    with SERVER_CSV.open() as f:
        for row in csv.DictReader(f):
            if row["date"] not in days:
                days.append(row["date"])
    return days


def build_db(server_rows: list[dict], partner_rows: list[dict]) -> sqlite3.Connection:
    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript(
        """
        CREATE TABLE server_revenue (
            date TEXT NOT NULL,
            partner TEXT NOT NULL,
            bundle TEXT NOT NULL,
            revenue REAL NOT NULL
        );
        CREATE TABLE partner_revenue (
            date TEXT NOT NULL,
            partner TEXT NOT NULL,
            bundle TEXT NOT NULL,
            revenue REAL NOT NULL
        );
        """
    )
    conn.executemany(
        "INSERT INTO server_revenue VALUES (:date, :partner, :bundle, :revenue)",
        server_rows,
    )
    conn.executemany(
        "INSERT INTO partner_revenue VALUES (:date, :partner, :bundle, :revenue)",
        partner_rows,
    )
    conn.commit()
    return conn


def main() -> None:
    with SERVER_CSV.open() as f:
        server_rows = list(csv.DictReader(f))

    days = load_server_dates()
    fetch_days = each_date(
        (date.fromisoformat(days[0]) - timedelta(days=1)).isoformat(),
        days[-1],
    )
    partner_rows = []
    for day in fetch_days:
        report = fetch_report(day)
        for row in report.get("rows", []):
            partner_rows.append(
                {
                    "date": date_from_timestamp(row["timestamp"]),
                    "partner": row["partner"],
                    "bundle": row["bundle"],
                    "revenue": row["revenue"],
                }
            )

    conn = build_db(server_rows, partner_rows)

    gaps = conn.execute(
        """
        WITH server_tot AS (
            SELECT date, partner, SUM(revenue) AS server_revenue
            FROM server_revenue
            GROUP BY date, partner
        ),
        partner_tot AS (
            SELECT date, partner, SUM(revenue) AS partner_revenue
            FROM partner_revenue
            GROUP BY date, partner
        )
        SELECT
            s.date,
            s.partner,
            ROUND(s.server_revenue, 2) AS server_revenue,
            ROUND(COALESCE(p.partner_revenue, 0), 2) AS partner_revenue,
            ROUND(COALESCE(p.partner_revenue, 0) - s.server_revenue, 2) AS gap,
            CASE
                WHEN s.server_revenue = 0 THEN NULL
                ELSE ROUND(
                    (COALESCE(p.partner_revenue, 0) - s.server_revenue)
                    * 100.0 / s.server_revenue,
                    2
                )
            END AS gap_pct,
            CASE WHEN p.partner IS NULL THEN 1 ELSE 0 END AS partner_missing
        FROM server_tot s
        LEFT JOIN partner_tot p
          ON s.date = p.date AND s.partner = p.partner
        ORDER BY s.date, s.partner
        """
    ).fetchall()

    print(
        f"{'date':<12} {'partner':<18} {'server':>10} {'partner':>10} "
        f"{'gap':>10} {'gap %':>8}  status"
    )
    print("-" * 84)
    for row in gaps:
        if row["partner_missing"]:
            status = "MISSING"
        else:
            status = "OK"
        gap_pct = row["gap_pct"]
        gap_txt = "" if gap_pct is None else f"{gap_pct:.2f}"
        print(
            f"{row['date']:<12} {row['partner']:<18} {row['server_revenue']:>10.2f} "
            f"{row['partner_revenue']:>10.2f} {row['gap']:>10.2f} {gap_txt:>8}  {status}"
        )

    yesterday = days[-1]
    print()
    print(f"Alerts for {yesterday} (threshold {THRESHOLD:.0%}):")
    yesterday_rows = [r for r in gaps if r["date"] == yesterday]
    alerts = []
    for row in yesterday_rows:
        if row["partner_missing"]:
            alerts.append(f"  - {row['partner']}: no partner data")
        elif row["gap_pct"] is not None and abs(row["gap_pct"]) / 100.0 > THRESHOLD:
            alerts.append(
                f"  - {row['partner']}: gap {row['gap_pct']:.2f}% "
                f"({row['gap']:.2f})"
            )
    if alerts:
        for line in alerts:
            print(line)
    else:
        print("  (none)")

    print()
    print(f"Raw responses saved under {RAW_DIR}/")
    print(f"Database written to {DB_PATH}")


if __name__ == "__main__":
    main()

# Partner Revenue Reconciliation

Starter kit for the ProgrammaticX junior developer home task.

The PDF you received with this zip is the full brief. Everything you need is in this zip. This README is only about how to run the starter.

Please aim for 2–3 hours, and stop at 3. You do not need to do every optional part. If you run out of time, write in your README what you would do next.

You can keep this Python starter and build on it, or rewrite it in TypeScript. If you rewrite it, please keep the same data files and the same API behaviour.

## What is in this folder

- `data/server_revenue.csv` — our revenue (14 days, five partners). Columns, in everyday words:
  - `date` — the day
  - `partner` — the company
  - `bundle` — the app or website
  - `revenue` — the figure you compare
- `mock_api/` — a small program that serves the partner’s revenue. It is called an API — that is simply a way to ask for their data. No extra packages needed.
- `reconcile.py` — a starting point that pulls the API, saves the raw responses, loads the revenue into SQLite, and prints a gap table (our revenue vs the partner’s revenue).

## Setup

You need Python 3.10 or newer. There are no third-party packages to install.

```bash
python3 --version
```

## Run the mock API

In one terminal, from this folder:

```bash
python3 mock_api/server.py
```

It listens on `http://127.0.0.1:8000`.

```bash
curl "http://127.0.0.1:8000/report?date=2026-10-20"
```

`GET /report?date=YYYY-MM-DD` returns a JSON object with a `rows` array. Each row has:

- `partner` — the company
- `bundle` — the app or website
- `revenue` — the figure you compare
- `timestamp` — the date and time on a partner record

To use another port:

```bash
PORT=8080 python3 mock_api/server.py
```

If you change the port, point `reconcile.py` at the same one (`API_BASE` near the top of the file).

## Run the starter script

In a second terminal, from this folder:

```bash
python3 reconcile.py
```

The script:

1. Calls the partner API for each date in our revenue, and for the day before the first date
2. Saves each raw response unchanged under `raw/`
3. Loads our revenue and the partner’s revenue into a local SQLite file (`reconcile.db`)
4. Prints a gap table, per day and partner, of our revenue vs the partner’s revenue, plus a short alert section

Make sure the numbers you report are correct.

The data runs from 18 October 2026 through 31 October 2026. Treat the most recent day in the data as “yesterday” when you build the alert.

## What to send us

A GitHub repository link, with a README that covers everything asked for in the brief: how to run your project, how you made sure the numbers are correct, the decisions you made, a short description of the one feature you would build (what, why, and roughly how), where you used AI and how you checked its output, and, if you ran out of time, what you would do next.

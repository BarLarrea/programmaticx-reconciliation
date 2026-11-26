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

---

## Decisions log (working notes, to be rewritten into the final README)

### Ingest

- **Rewritten in TypeScript** (Node 24). `mock_api/` and the data files are unchanged.
- **Raw responses are saved byte-for-byte** as `raw/report_<day>.json` before any parsing. Checked with `cmp` against a live `curl` of the API.
- **Fetch range:** from the day before the first CSV date to the last CSV date. Partner timestamps are UTC, and records from late evening UTC fall on the next day in Israel, so the day before is needed. We fetch every day in that range, not only the dates that appear in the CSV. If our server had no rows for a day, that day still gets fetched, and the partner's revenue shows up as a gap instead of quietly disappearing. The Python starter does the same.
- **The day a row belongs to comes from its `timestamp`, not from the `date` we asked the API for.** In the data, `2026-10-24` returns no rows, and `2026-10-25` returns rows for two Israel days.
- **Parse = shape check only.** Each source is parsed and validated in `src/ingest/`: JSON or CSV into typed rows, and every field is checked for the right type. No values are changed there. Cleaning happens in `src/transform/`.
- **Bad input stops the run (fail fast).** Invalid JSON, a missing `rows` array, or any malformed row throws a clear error, and nothing is loaded or reported. A report built on partial data could show a wrong gap without anyone noticing. There are no malformed rows in the current data (all 152 partner rows and 154 server rows pass).
  - *Next step:* move bad rows into a quarantine list with a reason, keep the run going, and mark that partner and day as "incomplete" in the report instead of computing a gap.

### Project structure

- The folders follow the ETL stages, but each one is named for what it does: `src/ingest/` (extract: fetch, save raw, validate shape), `src/transform/` (clean and convert values), and `src/db/` (load into SQLite, plus the reconciliation queries). It is called `db/` and not `load/` because it also holds the gap and flag queries.

### Transform

- **Partner names:** the names in our CSV are the canonical ones, because the CSV is our own record and its names are consistent. An explicit alias map in `src/config/businessConfig.ts` maps `magnite inc.` and `MGNI` to `Magnite`. The alias is the key, so one alias can never belong to two partners (the same shape as an `alias PRIMARY KEY` table). Matching is exact, with no case folding or trimming, because the data has no such variants. An unknown name passes through unchanged and does not stop the run, so it shows up in the report as its own partner with no server revenue instead of disappearing.
- **Why the three Magnite names are one partner:**
  - Magnite, Inc. is a real SSP listed on NASDAQ as `MGNI`, so one name is the legal name and one is the stock ticker.
  - In the data, every Israel day has exactly one row for each of Magnite's two bundles in our CSV (`com.news.daily`, `com.games.arcade`), never two rows for the same bundle. The names rotate from day to day, and each amount is within about 2% of our CSV.
  - In a real company this would be confirmed with the partnerships or ad-ops team.
  - *Next step:* ask the partner API for a stable `partner_id` and match on that instead of free-text names. There is no such ID in the data today.
- **Partner dates:** each partner row's day is the Israel (`Asia/Jerusalem`) calendar day of its UTC `timestamp`, using `Intl.DateTimeFormat`. It is not a fixed +2 or +3 hours, because Israel moved from UTC+3 to UTC+2 on 2026-10-25, in the middle of our data.
  - Checked on the boundaries: `2026-10-24T20:59:59Z` is still 2026-10-24, `21:00:00Z` is 2026-10-25 (UTC+3). After the clock change, `2026-10-25T21:59:59Z` is still 2026-10-25, and `22:00:00Z` is 2026-10-26 (UTC+2).
  - Checked on the data: after conversion, every Israel day from 2026-10-18 to 2026-10-30 has exactly 11 partner rows, the same count as our CSV. 2026-10-31 has 9, because OpenX sent nothing.
- **PubMatic revenue is divided by 100 (assumption: the API reports it in cents).** The rule is listed in `businessConfig.partnersReportingInCents`, not hidden in the code, and the raw files keep the original values.
  - *Evidence from the data:* for all 42 PubMatic rows (14 days × 3 bundles), the API value divided by our CSV value is between 98.1 and 102.0, so it is 100 times our figure, within the same ±2% the other partners show. All 42 PubMatic values are whole numbers, while 108 of the other partners' 110 values have cents. A real jump in revenue would not come out at exactly ×100 on every bundle, every day, for two weeks.
  - *Why not leave it and flag it:* PubMatic would be flagged every day with a gap of about +9,800%. An alert that fires every day gets ignored, and it would hide a real PubMatic gap, such as a day 20% short.
  - *How I would confirm it in a real company:*
    1. Read PubMatic's API documentation for the unit of the revenue field.
    2. Ask our PubMatic account manager or the ad-ops team that owns the integration.
    3. Compare one day's API value with PubMatic's own dashboard or invoice for that day. The invoice is what we are actually paid.
  - *Next step:* ask the partner API to send a currency or unit field with each row, so the unit is stated rather than inferred.
- **One function applies the rules:** `cleanPartnerRows` returns new rows in the same shape as our CSV (`date`, `partner`, `bundle`, `revenue`), so both sources load into tables of the same shape. It maps the name first, because the cents rule looks partners up by their CSV name. The raw rows are not changed.
  - *Check after cleaning:* all partner rows use the five CSV names. A quick comparison of daily totals per partner (before the SQL step) gave 70 (date, partner) pairs. All of them are within 10%, except two on 2026-10-31: OpenX has no partner data, and Sovrn is at -16.78%.
- **Our CSV is not cleaned:** it already has five consistent partner names and local dates, so no rules are added for it.

### Load

- **SQLite through Node's built-in `node:sqlite`**, in `reconcile.db` at the project root. The file is in `.gitignore`.
- **The database is rebuilt on every run.** Each run loads all the data again from the CSV and the API, so adding to the old tables would load every row twice and double the totals. The database is not a source of truth: it can always be rebuilt from the CSV and the raw files. The Python starter does the same.
  - *Next step:* keep a history of runs (for example a `run_id` column) to see how a partner's figures change between runs.
- **Two tables with the same shape**, `server_revenue` and `partner_revenue` (`date`, `partner`, `bundle`, `revenue`). Rows are stored per bundle, as in the sources. Totals per partner are left to SQL.
- **SQL lives in `src/db/`:** the table structure in `schema.ts`, and the statements that work on the data (inserts, and later the gap and flag queries) in `queries.ts`. Values are passed as named parameters, never pasted into the SQL text.
- **Both sources are loaded in one transaction**, so the database never holds only part of the data.

### Gap calculation (SQL)

- **One query, `SELECT_DAILY_GAPS` in `src/db/queries.ts`.** It sums each source per date and partner, takes the `UNION` of the (date, partner) pairs from both sources, and `LEFT JOIN`s each side's totals onto those pairs. A pair that exists on one side only is not lost. The Python starter joins from our side only, so a partner-only pair would disappear.
- **Direction:** `gap = partner revenue - our revenue`. Negative means the partner reports less than we counted. This is the starter's direction too.
- **Percentage:** `gap_pct = gap / our revenue × 100`, keeping the sign. The brief measures "away from ours", so our revenue is the base.
- **Missing data stays `NULL`, never 0.** When a partner sent nothing for a day, its total, `gap` and `gap_pct` are `NULL`. The starter used `COALESCE(..., 0)`, which turned a missing partner into a -100% gap.
- **Our revenue of 0:** `NULLIF(our revenue, 0)` makes `gap_pct` `NULL` instead of dividing by zero. The amount `gap` is still shown. No such case in the data, so no extra flag.
- **No rounding in SQL.** Values are rounded to 2 decimals only when the report prints them, so the 10% flag is decided on the exact number.
  - *Edge case left out:* a gap just over 10%, such as 10.004%, would be flagged but printed as 10.00%. It does not happen in this data. If it mattered, the report could show more decimals only for flagged rows that round to 10.00%.
- **A pair with our data missing** (partner data only, for example an unknown partner name) shows up in the table with our revenue `NULL`. It gets no flag, because the brief asks for two flags only.

### Data findings (handled in later steps)

- Magnite shows up under three names in the API: `Magnite`, `magnite inc.`, `MGNI`.
- PubMatic reports revenue in cents (`17616` against `178.70` in our CSV). All PubMatic values are whole numbers.
- OpenX sent no data for 2026-10-31 (the most recent day).
- Israel switched from summer to winter time on 2026-10-25 (UTC+3 to UTC+2), so dates must be converted with the time zone, not a fixed offset.

### Tooling

- **Built-in `node:sqlite`**: no native dependency to compile, and its API is synchronous like `better-sqlite3`.
- **Tests: Node's built-in `node:test`, run through `tsx` (`npm test`).** The brief asks for one small test, so a test framework dependency was not worth it. Plain `node --test` cannot run our files, because the TypeScript imports use `.js` paths that only `tsx` maps to `.ts`.
  - `tests/partnerRows.test.ts` checks the cleaning: the Magnite aliases, the Israel day on both sides of the 2026-10-25 clock change, PubMatic cents, and that the raw rows are not changed.
  - To make sure the tests can fail, the config was broken on purpose (time zone set to UTC, cents list emptied). Three of the four tests failed, and all passed again once the config was restored.
- **`csv-parse`**: handles quoted fields correctly, which splitting on commas does not.
- **Entry point `src/main.ts`**, run with `npm run reconcile`.

### AI use and how its output was checked (working notes)

- I wrote this project with Claude Code. I reviewed each change before it was committed, and I did not take any code without understanding it.
- **I checked the code by running it, not only by reading it.** For each step I ran the new code from `main.ts` against the mock API and looked at the output. For example, I printed the partner rows with `console.table` before and after `normalizePartnerName`, and checked that only the three Magnite names changed (28 rows, all `Magnite` afterwards). These checks stay out of the commits.
- **I pushed back on AI suggestions that were too complex.** The first version of the alias map was rebuilt into a reverse lookup when the file loaded. I asked for something simpler, and it became one dictionary lookup.

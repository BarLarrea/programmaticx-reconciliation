import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createDatabase, getDailyGaps, loadRevenue } from "../src/db/database.js";
import { addStatus } from "../src/report/status.js";
import { STATUS, type RevenueRow } from "../src/types/revenue.js";

/** One revenue row for 2026-10-31, so each test sets only the partner and revenue. */
function revenueRow(partner: string, revenue: number): RevenueRow {
    return { date: "2026-10-31", partner, bundle: "com.news.daily", revenue };
}

describe("getDailyGaps", () => {
    test("rounds gap_pct in SQL, so the flag matches what the report shows", () => {
        const db = createDatabase(":memory:");
        loadRevenue(
            db,
            [revenueRow("A", 100000), revenueRow("B", 100000)],
            [revenueRow("A", 110004), revenueRow("B", 110010)]
        );

        const result = addStatus(getDailyGaps(db));

        assert.equal(result.length, 2);
        assert.equal(result[0]?.gapPct, 10); // 10.004% is shown as 10
        assert.equal(result[0]?.status, STATUS.OK);
        assert.equal(result[1]?.gapPct, 10.01);
        assert.equal(result[1]?.status, STATUS.GAP);
    });
});

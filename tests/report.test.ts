import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { findAlerts } from "../src/report/alerts.js";
import { addStatus } from "../src/report/status.js";
import {
    STATUS,
    type ReconciliationRow,
    type ReportRow
} from "../src/types/revenue.js";

/** A row with no gap, so each test sets only what it checks. */
function row(overrides: Partial<ReconciliationRow>): ReconciliationRow {
    return {
        date: "2026-10-31",
        partner: "OpenX",
        serverRevenue: 100,
        partnerRevenue: 100,
        gap: 0,
        gapPct: 0,
        ...overrides
    };
}

describe("addStatus", () => {
    test("gives each row the status of the first rule that matches", () => {
        const rows = [
            row({}),
            row({ partnerRevenue: 110, gap: 10, gapPct: 10 }), // exactly 10% is not over
            row({ partnerRevenue: 110.01, gap: 10.01, gapPct: 10.01 }),
            row({ partnerRevenue: 80, gap: -20, gapPct: -20 }), // below ours counts too
            row({ partnerRevenue: null, gap: null, gapPct: null }),
            row({ serverRevenue: null, gap: null, gapPct: null })
        ];

        const result = addStatus(rows);

        assert.equal(result.length, 6);
        assert.equal(result[0]?.status, STATUS.OK);
        assert.equal(result[1]?.status, STATUS.OK);
        assert.equal(result[2]?.status, STATUS.GAP);
        assert.equal(result[3]?.status, STATUS.GAP);
        assert.equal(result[4]?.status, STATUS.NO_PARTNER_DATA);
        assert.equal(result[5]?.status, STATUS.NO_SERVER_DATA);
    });
});

describe("findAlerts", () => {
    test("keeps only gaps and missing partners from the given day", () => {
        const rows: ReportRow[] = [
            { ...row({ partner: "A" }), status: STATUS.OK },
            { ...row({ partner: "B" }), status: STATUS.GAP },
            { ...row({ partner: "C" }), status: STATUS.NO_PARTNER_DATA },
            { ...row({ partner: "D" }), status: STATUS.NO_SERVER_DATA },
            { ...row({ partner: "E", date: "2026-10-30" }), status: STATUS.GAP }
        ];

        const alerts = findAlerts(rows, "2026-10-31");

        assert.equal(alerts.length, 2);
        assert.equal(alerts[0]?.partner, "B");
        assert.equal(alerts[1]?.partner, "C");
    });
});

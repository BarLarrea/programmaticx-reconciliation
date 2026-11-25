import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { cleanPartnerRows } from "../src/transform/partnerRows.js";
import type { PartnerApiRow } from "../src/types/revenue.js";

/** A raw partner row with sensible defaults, so each test sets only what it checks. */
function rawRow(overrides: Partial<PartnerApiRow>): PartnerApiRow {
    return {
        partner: "OpenX",
        bundle: "com.news.daily",
        revenue: 100,
        timestamp: "2026-10-20T12:00:00Z",
        ...overrides
    };
}

describe("cleanPartnerRows", () => {
    test("maps every Magnite alias to the CSV name and keeps other names", () => {
        const names = ["Magnite", "magnite inc.", "MGNI", "OpenX", "New Partner"];

        const cleaned = cleanPartnerRows(names.map((partner) => rawRow({ partner })));

        assert.deepEqual(
            cleaned.map((row) => row.partner),
            ["Magnite", "Magnite", "Magnite", "OpenX", "New Partner"]
        );
    });

    test("uses the Israel day of the UTC timestamp, before and after the clock change", () => {
        const timestamps = [
            "2026-10-24T20:59:59Z", // 23:59 Israel summer time (UTC+3)
            "2026-10-24T21:00:00Z", // 00:00 next day in Israel
            "2026-10-25T21:59:59Z", // 23:59 Israel winter time (UTC+2)
            "2026-10-25T22:00:00Z" // 00:00 next day in Israel
        ];

        const cleaned = cleanPartnerRows(timestamps.map((timestamp) => rawRow({ timestamp })));

        assert.deepEqual(
            cleaned.map((row) => row.date),
            ["2026-10-24", "2026-10-25", "2026-10-25", "2026-10-26"]
        );
    });

    test("converts PubMatic from cents and leaves other partners in dollars", () => {
        const cleaned = cleanPartnerRows([
            rawRow({ partner: "PubMatic", revenue: 17616 }),
            rawRow({ partner: "MGNI", revenue: 328.53 }),
            rawRow({ partner: "OpenX", revenue: 292.74 })
        ]);

        assert.deepEqual(
            cleaned.map((row) => row.revenue),
            [176.16, 328.53, 292.74]
        );
    });

    test("returns rows in the CSV shape and leaves the raw rows unchanged", () => {
        const raw = rawRow({ partner: "MGNI", timestamp: "2026-10-17T21:34:18Z" });
        const before = structuredClone(raw);

        const [cleaned] = cleanPartnerRows([raw]);

        assert.deepEqual(cleaned, {
            date: "2026-10-18",
            partner: "Magnite",
            bundle: "com.news.daily",
            revenue: 100
        });
        assert.deepEqual(raw, before);
    });
});

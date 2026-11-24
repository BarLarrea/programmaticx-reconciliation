import { parse } from "csv-parse/sync";
import type { PartnerApiRow, RevenueRow } from "../types/revenue.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_COLUMNS = ["date", "partner", "bundle", "revenue"];

/**
 * Parses our revenue CSV into rows and checks every value.
 * Throws with the row number on the first bad row.
 */
export function parseServerCsv(text: string): RevenueRow[] {
    let headers: string[] = [];

    const records: Record<string, string | undefined>[] = parse(text, {
        columns: (columns: string[]) => {
            headers = columns;
            return columns;
        },
        skip_empty_lines: true,
        trim: true
    });

    const missingColumns = REQUIRED_COLUMNS.filter(
        (column) => !headers.includes(column)
    );

    if (missingColumns.length > 0) {
        throw new Error(
            `Server CSV missing columns: ${missingColumns.join(", ")}`
        );
    }

    return records.map((record, i) => {
        const row = i + 1;
        const { date, partner, bundle, revenue } = record;
        const amount = Number(revenue);

        if (!date || !isValidDate(date)) {
            throw new Error(`Server CSV row ${row}: bad date "${date}"`);
        }
        if (!partner || !bundle) {
            throw new Error(`Server CSV row ${row}: missing partner or bundle`);
        }
        if (!revenue || !Number.isFinite(amount)) {
            throw new Error(`Server CSV row ${row}: bad revenue "${revenue}"`);
        }

        return { date, partner, bundle, revenue: amount };
    });
}

/**
 * Parses a raw partner response and checks it has the expected shape.
 * Throws a clear error instead of letting bad data through.
 */
export function parsePartnerReport(day: string, raw: Buffer): PartnerApiRow[] {
    const body: unknown = JSON.parse(raw.toString("utf-8"));
    if (
        typeof body !== "object" ||
        body === null ||
        !("rows" in body) ||
        !Array.isArray(body.rows)
    ) {
        throw new Error(`Unexpected response for ${day}: no "rows" array`);
    }
    return body.rows as PartnerApiRow[];
}

function isValidDate(value: string): boolean {
    if (!DATE_RE.test(value)) return false;

    const [year = NaN, month = NaN, day = NaN] = value.split("-").map(Number);

    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

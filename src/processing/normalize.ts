import type { PartnerApiRow } from "../types/revenue.js";

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

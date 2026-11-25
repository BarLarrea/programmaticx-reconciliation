import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import type { PartnerApiRow } from "../types/revenue.js";

/**
 * Fetches the partner report for each day, saves every raw response
 * unchanged under raw/, and returns all validated rows.
 *
 * The rows keep the partner's own values. Which day a row belongs to
 * comes from its timestamp later, not from the day we asked for.
 */
export async function fetchPartnerReports(days: string[]): Promise<PartnerApiRow[]> {
    const reports = await Promise.all(
        days.map(async (day) => {
            const raw = await fetchPartnerReportRaw(day);
            await saveRawReport(day, raw);
            return parsePartnerReport(day, raw);
        })
    );
    return reports.flat();
}

/**
 * Calls the partner API for one day and returns the response body
 * exactly as received (raw bytes, not parsed).
 */
export async function fetchPartnerReportRaw(day: string): Promise<Buffer> {
    const url = `${config.partnerApiBaseUrl}/report?date=${day}`;

    let res: Response;
    try {
        res = await fetch(url, {
            signal: AbortSignal.timeout(config.partnerApiTimeoutMs),
        });
    } catch (err) {
        throw new Error(
            `Could not reach the partner API at ${config.partnerApiBaseUrl}. ` +
                "Start it first with: python3 mock_api/server.py",
            { cause: err }
        );
    }

    if (!res.ok) {
        throw new Error(`Partner API returned ${res.status} for ${url}`);
    }

    return Buffer.from(await res.arrayBuffer());
}

/** Saves a raw partner response unchanged, as raw/report_<day>.json. */
export async function saveRawReport(day: string, raw: Buffer): Promise<void> {
    await mkdir(config.rawDir, { recursive: true });
    await writeFile(path.join(config.rawDir, `report_${day}.json`), raw);
}

/**
 * Parses a raw partner response and checks every row has the expected shape.
 * Validates shape only: no values are changed (cleaning happens in transform).
 * Throws a clear error instead of letting bad data through.
 */
export function parsePartnerReport(day: string, raw: Buffer): PartnerApiRow[] {
    let body: unknown;
    try {
        body = JSON.parse(raw.toString("utf-8"));
    } catch (err) {
        throw new Error(`Partner report for ${day} is not valid JSON`, { cause: err });
    }

    if (
        typeof body !== "object" ||
        body === null ||
        !("rows" in body) ||
        !Array.isArray(body.rows)
    ) {
        throw new Error(`Partner report for ${day} has no "rows" array`);
    }

    return body.rows.map((row: unknown, i: number) => {
        if (!isPartnerApiRow(row)) {
            throw new Error(
                `Partner report for ${day}, row ${i + 1}: unexpected shape ${JSON.stringify(row)}`
            );
        }
        return row;
    });
}

function isPartnerApiRow(value: unknown): value is PartnerApiRow {
    if (typeof value !== "object" || value === null) return false;
    const row = value as Record<string, unknown>;
    return (
        typeof row.partner === "string" &&
        row.partner.trim() !== "" &&
        typeof row.bundle === "string" &&
        row.bundle.trim() !== "" &&
        typeof row.revenue === "number" &&
        Number.isFinite(row.revenue) &&
        typeof row.timestamp === "string" &&
        !Number.isNaN(Date.parse(row.timestamp))
    );
}

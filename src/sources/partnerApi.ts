import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

/**
 * Calls the partner API for one day and returns the response body
 * exactly as received (raw bytes, not parsed).
 */
export async function fetchPartnerReportRaw(day: string): Promise<Buffer> {
    const url = `${config.partnerApiBaseUrl}/report?date=${day}`;

    let res: Response;

    try {
        res = await fetch(url, {
            signal: AbortSignal.timeout(config.partnerApiTimeoutMs)
        });
    } catch (err) {
        throw new Error(
            `Could not reach the partner API at ${config.partnerApiBaseUrl}.`,
            { cause: err }
        );
    }

    if (!res.ok) {
        throw new Error(`Partner API returned ${res.status} for ${url}`);
    }

    return Buffer.from(await res.arrayBuffer());
}

/**
 * Saves a raw partner response unchanged, as raw/report_<day>.json.
 */
export async function saveRawReport(day: string, raw: Buffer): Promise<void> {
    await mkdir(config.rawDir, { recursive: true });
    await writeFile(path.join(config.rawDir, `report_${day}.json`), raw);
}

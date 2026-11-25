import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { config } from "../config.js";
import type { RevenueRow } from "../types/revenue.js";
import { isValidDate } from "../utils/dates.js";

const REQUIRED_COLUMNS = ["date", "partner", "bundle", "revenue"];

/** Reads our revenue CSV from disk and returns its validated rows. */
export async function loadServerRevenue(): Promise<RevenueRow[]> {
    return parseServerCsv(await readFile(config.serverCsvPath, "utf-8"));
}

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
        trim: true,
    });

    const missingColumns = REQUIRED_COLUMNS.filter(
        (column) => !headers.includes(column)
    );
    if (missingColumns.length > 0) {
        throw new Error(`Server CSV missing columns: ${missingColumns.join(", ")}`);
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

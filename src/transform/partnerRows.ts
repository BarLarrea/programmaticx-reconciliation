import { businessConfig } from "../config/businessConfig.js";
import type { PartnerApiRow, RevenueRow } from "../types/revenue.js";
import { toLocalDate } from "../utils/dates.js";

/**
 * Turns raw partner rows into clean rows in the same shape as our CSV:
 * the CSV partner name, the Israel day, and revenue in dollars.
 * Returns new rows, the raw rows are not changed.
 */
export function cleanPartnerRows(rows: PartnerApiRow[]): RevenueRow[] {
    return rows.map((row) => {
        // Name first: toDollars looks partners up by their CSV name.
        const partner = normalizePartnerName(row.partner);

        return {
            date: toLocalDate(row.timestamp, businessConfig.timeZone),
            partner,
            bundle: row.bundle,
            revenue: toDollars(partner, row.revenue)
        };
    });
}

/** Maps a partner name from the API to the name used in our CSV. */
export function normalizePartnerName(name: string): string {
    return businessConfig.partnerAliases[name] ?? name;
}

/**
 * Converts a partner's revenue to dollars, the unit of our CSV.
 * Expects the partner name after normalizePartnerName.
 */
export function toDollars(partner: string, revenue: number): number {
    if (businessConfig.partnersReportingInCents.includes(partner)) {
        return revenue / 100;
    }
    return revenue;
}

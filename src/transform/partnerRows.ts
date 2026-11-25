import { businessConfig } from "../config/businessConfig.js";

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

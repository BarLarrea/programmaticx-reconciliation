/** One row as the partner API returns it (raw, not yet cleaned). */
export type PartnerApiRow = {
    partner: string;
    bundle: string;
    revenue: number;
    timestamp: string;
};

/** One cleaned revenue row for a single day, from either source. */
export type RevenueRow = {
    date: string;
    partner: string;
    bundle: string;
    revenue: number;
};

/**
 * Totals and gap for one (date, partner). A side is null when that
 * source had no rows for the pair, which is different from 0.
 */
export type GapRow = {
    date: string;
    partner: string;
    serverRevenue: number | null;
    partnerRevenue: number | null;
    gap: number | null;
    gapPct: number | null;
};

export type Alert =
    | { kind: "gap"; partner: string; gap: number; gapPct: number }
    | { kind: "missing"; partner: string };

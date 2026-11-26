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
 * Our totals compared with the partner's for one (date, partner).
 * A side is null when that source had no rows for the pair, which is
 * different from 0.
 */
export type ReconciliationRow = {
    date: string;
    partner: string;
    serverRevenue: number | null;
    partnerRevenue: number | null;
    gap: number | null;
    gapPct: number | null;
};

/** Every status a row can have, written once and used by name. */
export const STATUS = {
    OK: "OK",
    GAP: "GAP",
    NO_PARTNER_DATA: "NO PARTNER DATA",
    NO_SERVER_DATA: "NO SERVER DATA"
} as const;

/** One of the values in STATUS. */
export type Status = (typeof STATUS)[keyof typeof STATUS];

/** A reconciliation row with the status the report shows for it. */
export type ReportRow = ReconciliationRow & { status: Status };

export type PartnerApiRow = {
    partner: string;
    bundle: string;
    revenue: number;
    timestamp: string;
};

export type RevenueRow = {
    date: string;
    partner: string;
    bundle: string;
    revenue: number;
};

export type GapRow = {
    date: string;
    partner: string;
    ourRevenue: number;
    partnerRevenue: number | null;
    gap: number | null;
    gapPct: number | null;
};

export type Alert = { partner: string; kind: "gap" | "missing"; gapPct?: number };

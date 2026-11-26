import { businessConfig } from "../config/businessConfig.js";
import {
    STATUS,
    type ReconciliationRow,
    type ReportRow,
    type Status
} from "../types/revenue.js";

/**
 * Decides the status of one row. The first rule that matches wins.
 * A missing side comes first, because without it there is no gap.
 */
function decideStatus(row: ReconciliationRow): Status {
    if (row.partnerRevenue === null) return STATUS.NO_PARTNER_DATA;
    if (row.serverRevenue === null) return STATUS.NO_SERVER_DATA;

    const isBigGap =
        row.gapPct !== null &&
        Math.abs(row.gapPct) > businessConfig.gapThresholdPct;
    if (isBigGap) return STATUS.GAP;

    return STATUS.OK;
}

/** Returns new rows, each with its status. */
export function addStatus(rows: ReconciliationRow[]): ReportRow[] {
    return rows.map((row) => ({ ...row, status: decideStatus(row) }));
}

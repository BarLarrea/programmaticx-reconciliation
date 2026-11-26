import { STATUS, type ReportRow } from "../types/revenue.js";

/**
 * The rows to alert on for one day: a gap over the threshold, or a
 * partner that sent no revenue. The status already holds the decision,
 * so this only picks the rows.
 */
export function findAlerts(rows: ReportRow[], day: string): ReportRow[] {
    return rows.filter(
        (row) =>
            row.date === day &&
            (row.status === STATUS.GAP ||
                row.status === STATUS.NO_PARTNER_DATA)
    );
}

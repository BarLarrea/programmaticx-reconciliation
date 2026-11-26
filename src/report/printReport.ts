import { businessConfig } from "../config/businessConfig.js";
import type { ReportRow } from "../types/revenue.js";

/** What was loaded, shown above the tables. */
export type LoadSummary = {
    serverRows: number;
    partnerRows: number;
    firstDay: string;
    lastDay: string;
    dbPath: string;
};

/**
 * Prints what was loaded, every row as a table, and then the alerts
 * for the most recent day.
 */
export function printReport(
    rows: ReportRow[],
    alerts: ReportRow[],
    summary: LoadSummary
): void {
    console.log("Revenue reconciliation");
    console.log(
        `  Server rows:   ${summary.serverRows} ` +
            `(${summary.firstDay} to ${summary.lastDay})`
    );
    console.log(`  Partner rows:  ${summary.partnerRows}`);
    console.log(`  Database:      ${summary.dbPath}`);

    console.log();
    console.log("Daily gaps per partner");
    console.table(
        rows.map((row) => ({
            date: row.date,
            partner: row.partner,
            "server revenue": row.serverRevenue,
            "partner revenue": row.partnerRevenue,
            gap: row.gap,
            "gap %": row.gapPct,
            status: row.status
        }))
    );

    console.log();
    console.log(
        `Alerts for ${summary.lastDay} ` +
            `(gap over ${businessConfig.gapThresholdPct}%, or no partner data)`
    );
    if (alerts.length === 0) {
        console.log("  No alerts");
        return;
    }
    console.table(
        alerts.map((row) => ({
            partner: row.partner,
            status: row.status,
            gap: row.gap,
            "gap %": row.gapPct
        }))
    );
}

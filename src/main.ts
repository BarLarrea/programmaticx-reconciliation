import { appConfig } from "./config/appConfig.js";
import { createDatabase, getDailyGaps, loadRevenue } from "./db/database.js";
import { fetchPartnerReports } from "./ingest/partnerApi.js";
import { loadServerRevenue } from "./ingest/serverCsv.js";
import { findAlerts } from "./report/alerts.js";
import { printReport } from "./report/printReport.js";
import { addStatus } from "./report/status.js";
import { cleanPartnerRows } from "./transform/partnerRows.js";
import { addDays, eachDay } from "./utils/dates.js";

// 1. Ingest:

// server CSV
const serverRows = await loadServerRevenue();

const serverDays = serverRows.map((row) => row.date).sort();
const firstDay = serverDays[0];
const lastDay = serverDays.at(-1);
if (!firstDay || !lastDay) {
    throw new Error("Server CSV has no rows");
}

// partner API
// Partner timestamps are in UTC, and a late-evening UTC record falls on the
// next day in Israel. So we also fetch the day before our first date.
const fetchFrom = addDays(firstDay, -1);
const fetchDays = eachDay(fetchFrom, lastDay);
const rawPartnerRows = await fetchPartnerReports(fetchDays);

// 2. Transform
const partnerRows = cleanPartnerRows(rawPartnerRows);

// 3. Load
const db = createDatabase(appConfig.dbPath);
loadRevenue(db, serverRows, partnerRows);

// 4. Reconciliation
const gapRows = getDailyGaps(db);

// 5. Reporting
const reportRows = addStatus(gapRows);
const alerts = findAlerts(reportRows, lastDay);
const summary = {
    serverRows: serverRows.length,
    partnerRows: partnerRows.length,
    firstDay,
    lastDay,
    dbPath: appConfig.dbPath
};
printReport(reportRows, alerts, summary);

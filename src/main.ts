import { fetchPartnerReports } from "./ingest/partnerApi.js";
import { loadServerRevenue } from "./ingest/serverCsv.js";
import { addDays, eachDay } from "./utils/dates.js";

const serverRows = await loadServerRevenue();

// Partner timestamps are in UTC, and a late-evening UTC record falls on the
// next day in Israel. So we also fetch the day before our first date.
const serverDays = serverRows.map((row) => row.date).sort();
const firstDay = serverDays[0];
const lastDay = serverDays.at(-1);
if (!firstDay || !lastDay) {
    throw new Error("Server CSV has no rows");
}

const partnerRows = await fetchPartnerReports(eachDay(addDays(firstDay, -1), lastDay));

console.log(
    `Loaded ${serverRows.length} server rows (${firstDay} to ${lastDay}) ` +
        `and ${partnerRows.length} partner rows.`
);

import { fetchPartnerReportRaw, saveRawReport } from "./sources/partnerApi.js";
import { parsePartnerReport, parseServerCsv } from "./processing/normalize.js";
import { readServerCsv } from "./sources/serverCsv.js";

const raw = await fetchPartnerReportRaw("2026-10-20");
await saveRawReport("2026-10-20", raw);
const rows = parsePartnerReport("2026-10-20", raw);
const serverCsvText = await readServerCsv();
const serverRevenue = parseServerCsv(serverCsvText);

// console.log(raw);
// console.log(rows);
// console.log(serverRevenue);
console.log(serverRevenue);

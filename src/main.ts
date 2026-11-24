import { fetchPartnerReportRaw, saveRawReport } from "./sources/partnerApi.js";
import { parsePartnerReport } from "./processing/normalize.js";

const raw = await fetchPartnerReportRaw("2026-10-20");
await saveRawReport("2026-10-20", raw);
const rows = parsePartnerReport("2026-10-20", raw);

console.log(raw);
console.log(rows);

import path from "node:path";
import { fileURLToPath } from "node:url";

// Project root, two levels up from this file, whether running from
// src/config/ (tsx) or dist/config/ (node).
const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** Technical settings: where things are and how to reach them. */
export const appConfig = {
    partnerApiBaseUrl: process.env.PARTNER_API_BASE_URL ?? "http://127.0.0.1:8000",
    partnerApiTimeoutMs: 5000,

    serverCsvPath: path.join(ROOT, "data", "server_revenue.csv"),
    rawDir: path.join(ROOT, "raw"),
    dbPath: path.join(ROOT, "reconcile.db"),
};

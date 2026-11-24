import path from "node:path";
import { fileURLToPath } from "node:url";

// Project root, whether running from src/ (tsx) or dist/ (node).
const ROOT = fileURLToPath(new URL("..", import.meta.url));

export const config = {
    partnerApiBaseUrl: process.env.PARTNER_API_BASE_URL ?? "http://127.0.0.1:8000",
    partnerApiTimeoutMs: 5000,

    serverCsvPath: path.join(ROOT, "data", "server_revenue.csv"),
    rawDir: path.join(ROOT, "raw"),
    dbPath: path.join(ROOT, "reconcile.db"),

    gapThreshold: 0.1,
    timeZone: "Asia/Jerusalem",
};

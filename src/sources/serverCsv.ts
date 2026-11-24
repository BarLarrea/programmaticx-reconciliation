import { readFile } from "node:fs/promises";
import { config } from "../config.js";

/**
 * Reads our revenue CSV and returns its text as-is (not parsed).
 */
export async function readServerCsv(): Promise<string> {
    return readFile(config.serverCsvPath, "utf-8");
}

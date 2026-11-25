import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { RevenueRow } from "../types/revenue.js";
import {
    CREATE_TABLES,
    INSERT_PARTNER_ROW,
    INSERT_SERVER_ROW
} from "./queries.js";

/**
 * Creates an empty database with both tables.
 * `path` is a file path, or ":memory:" for a database that lives only
 * in memory and leaves no file behind (used by tests).
 */
export function createDatabase(path: string): DatabaseSync {
    // Each run loads all the data again, so delete the database file from
    // the last run; otherwise every row would be loaded twice.
    // A ":memory:" database has no file, so there is nothing to delete.
    if (path !== ":memory:") {
        rmSync(path, { force: true });
    }

    const db = new DatabaseSync(path);
    db.exec(CREATE_TABLES);
    return db;
}

/**
 * Loads our rows and the partner's rows in one transaction,
 * so the database never holds only part of the data.
 */
export function loadRevenue(
    db: DatabaseSync,
    serverRows: RevenueRow[],
    partnerRows: RevenueRow[]
): void {
    const insertServerRow = db.prepare(INSERT_SERVER_ROW);
    const insertPartnerRow = db.prepare(INSERT_PARTNER_ROW);

    db.exec("BEGIN");
    try {
        for (const row of serverRows) insertServerRow.run(row);
        for (const row of partnerRows) insertPartnerRow.run(row);
        db.exec("COMMIT");
    } catch (err) {
        db.exec("ROLLBACK");
        throw err;
    }
}

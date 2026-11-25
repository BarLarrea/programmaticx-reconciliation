/**
 * All SQL used by the project. Values are passed as named parameters
 * (:date, :partner, ...), never pasted into the SQL text.
 */

/** Both tables have the same shape, the shape of a cleaned row. */
export const CREATE_TABLES = `
    CREATE TABLE server_revenue (
        date    TEXT NOT NULL,
        partner TEXT NOT NULL,
        bundle  TEXT NOT NULL,
        revenue REAL NOT NULL
    );

    CREATE TABLE partner_revenue (
        date    TEXT NOT NULL,
        partner TEXT NOT NULL,
        bundle  TEXT NOT NULL,
        revenue REAL NOT NULL
    );
`;

export const INSERT_SERVER_ROW = `
    INSERT INTO server_revenue (date, partner, bundle, revenue)
    VALUES (:date, :partner, :bundle, :revenue)
`;

export const INSERT_PARTNER_ROW = `
    INSERT INTO partner_revenue (date, partner, bundle, revenue)
    VALUES (:date, :partner, :bundle, :revenue)
`;

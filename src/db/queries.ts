/**
 * SQL that works on the data: inserts now, and the gap and flag queries
 * later. Values are passed as named parameters (:date, :partner, ...),
 * never pasted into the SQL text. The table structure is in schema.ts.
 */

export const INSERT_SERVER_ROW = `
    INSERT INTO server_revenue (date, partner, bundle, revenue)
    VALUES (:date, :partner, :bundle, :revenue)
`;

export const INSERT_PARTNER_ROW = `
    INSERT INTO partner_revenue (date, partner, bundle, revenue)
    VALUES (:date, :partner, :bundle, :revenue)
`;

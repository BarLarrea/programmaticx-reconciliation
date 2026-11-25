/** The database structure. Both tables have the shape of a cleaned row. */
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

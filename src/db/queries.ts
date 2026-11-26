/**
 * SQL that works on the data: inserts, the gap query, and the flag
 * queries later. Values are passed as named parameters (:date, :partner, ...),
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

/**
 * Totals and gap for every (date, partner) that appears in either source.
 *
 * 1. Sum each source per date and partner.
 * 2. UNION the (date, partner) pairs of both sources, so a pair that
 *    exists on one side only is not lost.
 * 3. LEFT JOIN each side's totals onto the pairs. A side with no rows
 *    stays NULL (not 0), and so do gap and gap_pct.
 *
 * gap = partner revenue - our revenue (negative: partner reports less)
 * gap_pct = gap as a percentage of our revenue; NULL when ours is 0
 * Values are not rounded here; the report rounds them for display.
 */
export const SELECT_DAILY_GAPS = /*sql*/ `
    WITH server_totals AS (
        SELECT date, partner, SUM(revenue) AS revenue
        FROM server_revenue
        GROUP BY date, partner
    ),
    partner_totals AS (
        SELECT date, partner, SUM(revenue) AS revenue
        FROM partner_revenue
        GROUP BY date, partner
    ),
    pairs AS (
        SELECT date, partner FROM server_totals
        UNION
        SELECT date, partner FROM partner_totals
    )
    SELECT
        pairs.date,
        pairs.partner,
        s.revenue AS server_revenue,
        p.revenue AS partner_revenue,
        p.revenue - s.revenue AS gap,
        (p.revenue - s.revenue) * 100.0 / NULLIF(s.revenue, 0) AS gap_pct
    FROM pairs
    LEFT JOIN server_totals AS s
        ON s.date = pairs.date AND s.partner = pairs.partner
    LEFT JOIN partner_totals AS p
        ON p.date = pairs.date AND p.partner = pairs.partner
    ORDER BY pairs.date, pairs.partner
`;

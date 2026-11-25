const MAGNITE = "Magnite";

/**
 * Other names the partner API uses for a partner, mapped to the name in
 * our CSV. Each alias is a key, so it can belong to one partner only.
 * Matching is exact: a new spelling shows up in the report as its own
 * partner until it is added here.
 */
const partnerAliases: Record<string, string> = {
    "magnite inc.": MAGNITE,
    MGNI: MAGNITE
};

/** Business rules: what counts as a gap, how a day is defined, who is who. */
export const businessConfig = {
    /** Flag a partner when |gap| is more than this share of our revenue. */
    gapThreshold: 0.1,

    /** Days are counted in Israel time, the same as our CSV dates. */
    timeZone: "Asia/Jerusalem",

    partnerAliases,

    /**
     * Partners whose API reports revenue in cents instead of dollars.
     * Names as in our CSV. See the README for the evidence.
     */
    partnersReportingInCents: ["PubMatic"]
};

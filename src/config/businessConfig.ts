/** Business rules: what counts as a gap and how a day is defined. */
export const businessConfig = {
    /** Flag a partner when |gap| is more than this share of our revenue. */
    gapThreshold: 0.1,

    /** Days are counted in Israel time, the same as our CSV dates. */
    timeZone: "Asia/Jerusalem",
};

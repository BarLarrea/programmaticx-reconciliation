const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar day in YYYY-MM-DD form (rejects 2026-02-30). */
export function isValidDate(value: string): boolean {
    if (!DATE_RE.test(value)) return false;

    const [year = NaN, month = NaN, day = NaN] = value.split("-").map(Number);

    const date = new Date(0);
    // JS months start at 0 (0 = January), so subtract 1 from the CSV month.
    date.setUTCFullYear(year, month - 1, day);

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(day: string, days: number): string {
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

/** Every YYYY-MM-DD date from start to end, both included. */
export function eachDay(start: string, end: string): string[] {
    const days: string[] = [];
    for (let day = start; day <= end; day = addDays(day, 1)) {
        days.push(day);
    }
    return days;
}

// ISO-8601 week numbering (Monday-start week, week 1 contains the year's first Thursday) —
// matches PHP Carbon's weekOfYear used on the backend, so week numbers computed here
// line up with whatever the server records.
export function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getWeekRange(date: Date): { start: string; end: string } {
    const day = date.getDay() || 7; // Mon=1 .. Sun=7
    const monday = new Date(date);
    monday.setDate(date.getDate() - day + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (x: Date) => x.toISOString().slice(0, 10);
    return { start: fmt(monday), end: fmt(sunday) };
}

export function isSubmissionWindowOpen(date: Date = new Date()): boolean {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
}

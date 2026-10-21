// Every party happens in New York, so dates and times on the booking page are New York wall-clock time no matter
// where the visitor (or the Cloudflare worker, which runs in UTC) is. Dates are "YYYY-MM-DD", times are "HH:MM".

export const TIME_ZONE = "America/New_York";

const partsFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
});

function zoneParts(ms: number) {
    const p: Record<string, string> = {};
    for (const part of partsFormat.formatToParts(new Date(ms))) p[part.type] = part.value;
    return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second };
}

// How far New York is ahead of UTC at this instant (negative: -4h in summer, -5h in winter).
function offsetAt(ms: number) {
    const whole = Math.floor(ms / 1000) * 1000;
    const p = zoneParts(whole);
    return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - whole;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The instant (ms since epoch) of a New York date and time. */
export function zonedToUtc(date: string, time: string): number {
    const [y, m, d] = date.split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    const naive = Date.UTC(y, m - 1, d, h, mi);
    const guess = naive - offsetAt(naive);
    // Near a daylight-saving switch the offset at the answer can differ from the offset at the guess.
    return naive - offsetAt(guess);
}

/** The New York date and time of an instant. */
export function utcToZoned(ms: number): { date: string; time: string } {
    const p = zoneParts(ms);
    return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.mi)}` };
}

export function todayInZone(now: number) {
    return utcToZoned(now).date;
}

export function addDays(date: string, days: number) {
    const [y, m, d] = date.split("-").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + days));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayOf(date: string) {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function toMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

export function fromMinutes(minutes: number) {
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export const isDate = (v: unknown): v is string =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && addDays(v, 0) === v;
export const isTime = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/** "3:30 PM" */
export function formatTime(time: string) {
    const [h, m] = time.split(":").map(Number);
    return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

/** "Saturday, October 24, 2026" */
export function formatDate(date: string, options: Intl.DateTimeFormatOptions = {}) {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        ...options,
    });
}

/** "Sat, Oct 24, 3:30 PM – 6:30 PM" for a booking's start and end instants. */
export function formatRange(start: number, end: number) {
    const s = utcToZoned(start);
    const e = utcToZoned(end);
    return `${formatDate(s.date, { weekday: "short", month: "short", year: undefined })}, ${formatTime(s.time)} – ${formatTime(e.time)}`;
}

// Works out which party start times are still open. Used by the worker for the booking calendar and again,
// right before payment, to make sure nobody grabbed the slot in the meantime.
import { addDays, fromMinutes, isTime, todayInZone, toMinutes, weekdayOf, zonedToUtc } from "./time";

export interface DayHours {
    open: string;
    close: string;
}

export interface BookingSettings {
    // Opening hours by weekday, "0" (Sunday) to "6" (Saturday). A missing or null day is closed.
    hours: Record<string, DayHours | null>;
    // How many parties can run at the same time.
    crews: number;
    // Travel and pack-up time kept free after every party.
    bufferMinutes: number;
    // How soon a party can be booked online, and how far ahead.
    minNoticeHours: number;
    maxAdvanceDays: number;
}

// Mirrors the 10to8 setup this replaced: Friday afternoons, all day Saturday and Sunday evenings, two crews,
// an hour between parties.
export const DEFAULT_SETTINGS: BookingSettings = {
    hours: {
        "0": { open: "17:30", close: "22:30" },
        "1": null,
        "2": null,
        "3": null,
        "4": null,
        "5": { open: "12:00", close: "20:30" },
        "6": { open: "10:00", close: "22:00" },
    },
    crews: 2,
    bufferMinutes: 60,
    minNoticeHours: 24,
    maxAdvanceDays: 365,
};

// Start times are offered every half hour.
export const STEP_MINUTES = 30;

export interface Busy {
    start: number;
    end: number;
    // Blocked-off time closes the calendar for every crew.
    all?: boolean;
}

/** True when a party occupying [start, end) still leaves a crew free the whole time. */
export function fits(start: number, end: number, busy: Busy[], crews: number) {
    const overlapping = busy.filter((b) => b.start < end && b.end > start);
    if (overlapping.some((b) => b.all)) return false;
    if (overlapping.length < crews) return true;
    // Two parties that overlap the new one might not overlap each other, so count the most running at once.
    const edges: [number, number][] = [];
    for (const b of overlapping) edges.push([Math.max(b.start, start), 1], [Math.min(b.end, end), -1]);
    edges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let running = 0;
    for (const [, step] of edges) {
        running += step;
        if (running >= crews) return false;
    }
    return true;
}

/** Open start times ("HH:MM", New York time) on a date for a party of the given length. */
export function startTimes(date: string, minutes: number, settings: BookingSettings, busy: Busy[], now: number) {
    const day = settings.hours[String(weekdayOf(date))];
    if (!day || !isTime(day.open) || !isTime(day.close)) return [];
    if (date > addDays(todayInZone(now), settings.maxAdvanceDays)) return [];
    const earliest = now + settings.minNoticeHours * 3_600_000;
    const times: string[] = [];
    for (let t = toMinutes(day.open); t + minutes <= toMinutes(day.close); t += STEP_MINUTES) {
        const time = fromMinutes(t);
        const start = zonedToUtc(date, time);
        if (start < earliest) continue;
        if (fits(start, start + (minutes + settings.bufferMinutes) * 60_000, busy, settings.crews)) times.push(time);
    }
    return times;
}

/** The calendar time a booking takes up, including the gap after it. */
export function busyFor(start: number, end: number, bufferMinutes: number): Busy {
    return { start, end: end + bufferMinutes * 60_000 };
}

/** Fills in anything missing from settings saved in the database. */
export function normalizeSettings(saved: Partial<BookingSettings> | null | undefined): BookingSettings {
    const n = (v: unknown, fallback: number, min: number, max: number) =>
        typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
    const hours: Record<string, DayHours | null> = {};
    for (let d = 0; d < 7; d++) {
        const h = saved?.hours ? saved.hours[String(d)] : DEFAULT_SETTINGS.hours[String(d)];
        hours[String(d)] =
            h && isTime(h.open) && isTime(h.close) && toMinutes(h.open) < toMinutes(h.close)
                ? { open: h.open, close: h.close }
                : null;
    }
    return {
        hours,
        crews: n(saved?.crews, DEFAULT_SETTINGS.crews, 1, 10),
        bufferMinutes: n(saved?.bufferMinutes, DEFAULT_SETTINGS.bufferMinutes, 0, 600),
        minNoticeHours: n(saved?.minNoticeHours, DEFAULT_SETTINGS.minNoticeHours, 0, 24 * 60),
        maxAdvanceDays: n(saved?.maxAdvanceDays, DEFAULT_SETTINGS.maxAdvanceDays, 1, 730),
    };
}

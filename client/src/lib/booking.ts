// Booking rules shared by the booking page and the worker (public/_worker.js imports this file), so prices,
// deposits and open time slots are worked out the same way in both places. The worker's answer is the one that
// counts: it recomputes everything from ids and never trusts amounts sent by the browser.
import { ADD_ON_GROUPS, PARTY_PACKAGES, type AddOn, type PartyPackage } from "../data/packages";

// Every party date and time is in New York time, wherever the visitor (or the worker) happens to be.
export const TIME_ZONE = "America/New_York";

export interface DayHours {
    open: string; // "HH:MM", earliest start
    close: string; // "HH:MM", latest end
}

// Index 0 is Sunday, matching Date.getDay(). null means closed that day.
export type WeeklyHours = (DayHours | null)[];

export interface BookingSettings {
    weekly_hours: WeeklyHours;
    // Travel, setup and pack-up time kept free after every party.
    buffer_minutes: number;
    // How soon a party can be booked online. Anything sooner has to call.
    min_notice_hours: number;
    max_advance_days: number;
    // Start times are offered every this many minutes.
    slot_step_minutes: number;
    // How many parties can run at the same time (more than one when a second crew and truck are available).
    capacity: number;
}

// Used when the booking_settings row is missing. Hours are the ones that were set in 10to8 when online booking
// moved here (Oct 2026), except Thursday: the business never takes Thursday parties. The owner changes the real
// values on /admin.
export const DEFAULT_SETTINGS: BookingSettings = {
    weekly_hours: [
        { open: "17:30", close: "23:30" },
        null,
        null,
        null,
        null,
        { open: "12:00", close: "22:30" },
        { open: "10:00", close: "23:45" },
    ],
    buffer_minutes: 60,
    min_notice_hours: 24,
    max_advance_days: 365,
    slot_step_minutes: 30,
    capacity: 1,
};

export const MAX_CHILDREN = 60;

export interface AddOnChoice {
    id: string;
    qty: number;
}

export interface PricedLine {
    id: string;
    name: string;
    unitPrice: number;
    qty: number;
    total: number;
}

export interface Quote {
    pkg: PartyPackage;
    addOns: PricedLine[];
    minutes: number;
    total: number;
    deposit: number;
    balance: number;
}

const ADD_ONS: AddOn[] = ADD_ON_GROUPS.flatMap((g) => g.items);

export function findPackage(id: string) {
    return PARTY_PACKAGES.find((p) => p.id === id);
}

export function findAddOn(id: string) {
    return ADD_ONS.find((a) => a.id === id);
}

export const BOOKABLE_ADD_ON_GROUPS = ADD_ON_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((a) => a.price !== null),
})).filter((g) => g.items.length);

export class BookingError extends Error {}

// Online, only the package deposit is charged. Add-ons and the rest of the package are paid on the day,
// the same way the old 10to8 booking page worked.
export function quoteBooking(packageId: string, choices: AddOnChoice[]): Quote {
    const pkg = findPackage(packageId);
    if (!pkg) throw new BookingError("Please pick a party package.");

    const seen = new Set<string>();
    const addOns: PricedLine[] = [];
    let minutes = pkg.minutes;
    for (const choice of choices) {
        const addOn = findAddOn(choice.id);
        if (!addOn || addOn.price === null) throw new BookingError("One of the add-ons isn't available online.");
        if (seen.has(addOn.id)) throw new BookingError("An add-on was listed twice.");
        seen.add(addOn.id);
        const max = addOn.perChild ? MAX_CHILDREN : addOn.minutes ? 4 : 1;
        const qty = Math.floor(choice.qty);
        if (!Number.isFinite(qty) || qty < 1 || qty > max) throw new BookingError(`Check the quantity for ${addOn.name}.`);
        addOns.push({ id: addOn.id, name: addOn.name, unitPrice: addOn.price, qty, total: addOn.price * qty });
        if (addOn.minutes) minutes += addOn.minutes * qty;
    }

    const total = pkg.price + addOns.reduce((sum, a) => sum + a.total, 0);
    return { pkg, addOns, minutes, total, deposit: pkg.deposit, balance: total - pkg.deposit };
}

export const toCents = (dollars: number) => Math.round(dollars * 100);

// ---- Time zone helpers ---------------------------------------------------------------------------------------
// Workers have Intl but no time zone library, so these convert between New York wall-clock time and UTC by asking
// Intl for the zone's offset at a given instant.

const partsFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface ZonedParts {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    weekday: number; // 0 = Sunday
}

export function zonedParts(instant: Date): ZonedParts {
    const p = Object.fromEntries(partsFormatter.formatToParts(instant).map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, weekday: WEEKDAYS.indexOf(p.weekday) };
}

function offsetMinutes(instant: Date) {
    const p = Object.fromEntries(partsFormatter.formatToParts(instant).map((x) => [x.type, x.value]));
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return (asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000;
}

export const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// New York wall-clock date + time -> the real instant. On the fall-back hour the earlier instant wins; times
// skipped by spring-forward move an hour later, as clocks do.
export function zonedToUtc(date: string, time: string): Date {
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const guess = Date.UTC(y, m - 1, d, hh, mm);
    const first = guess - offsetMinutes(new Date(guess)) * 60000;
    const second = guess - offsetMinutes(new Date(first)) * 60000;
    const valid = [first, second].filter((t) => {
        const p = zonedParts(new Date(t));
        return p.date === date && p.time === time;
    });
    return new Date(valid.length ? Math.min(...valid) : Math.max(first, second));
}

export function addDays(date: string, days: number) {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekdayOf(date: string) {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export const minutesOf = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};

export const timeOf = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// "13:30" -> "1:30 PM"
export function formatTime(time: string) {
    const [h, m] = time.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

// "2026-11-07" -> "Saturday, November 7, 2026"
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

// ---- Availability --------------------------------------------------------------------------------------------

export interface BusyRange {
    start: number; // ms since epoch
    end: number; // ms since epoch, including the buffer after a party
}

// Most parties running at once anywhere inside [start, end).
function peakOverlap(start: number, end: number, busy: BusyRange[]) {
    const events: [number, number][] = [];
    for (const b of busy) {
        if (b.start >= end || b.end <= start) continue;
        events.push([Math.max(b.start, start), 1], [Math.min(b.end, end), -1]);
    }
    // Ends sort before starts at the same instant, so back-to-back ranges don't count as overlapping.
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let current = 0;
    let peak = 0;
    for (const [, change] of events) peak = Math.max(peak, (current += change));
    return peak;
}

// Whether a party blocking [start, end) fits: no time off in the way, and fewer than `capacity` other parties at
// any moment of it.
export function slotFits(start: number, end: number, capacity: number, busy: BusyRange[], blocked: BusyRange[]) {
    if (blocked.some((b) => start < b.end && end > b.start)) return false;
    return peakOverlap(start, end, busy) < capacity;
}

// Start times (New York "HH:MM") still open on one date for a party of `minutes`. A slot is open when the party
// fits inside the day's hours and the party plus the buffer after it fits around other parties and time off. Busy
// ranges already include the buffer after earlier parties, so parties on the same crew end up a buffer apart.
export function openStartTimes(
    date: string,
    minutes: number,
    settings: BookingSettings,
    busy: BusyRange[],
    now: Date,
    blocked: BusyRange[] = []
): string[] {
    const hours = settings.weekly_hours[weekdayOf(date)];
    if (!hours) return [];
    const earliest = now.getTime() + settings.min_notice_hours * 3600000;
    const latest = now.getTime() + settings.max_advance_days * 86400000;
    const step = Math.max(5, settings.slot_step_minutes);
    const close = minutesOf(hours.close);

    const open: string[] = [];
    for (let start = minutesOf(hours.open); start + minutes <= close; start += step) {
        const startAt = zonedToUtc(date, timeOf(start)).getTime();
        if (startAt < earliest || startAt > latest) continue;
        const blockEnd = startAt + (minutes + settings.buffer_minutes) * 60000;
        if (!slotFits(startAt, blockEnd, settings.capacity, busy, blocked)) continue;
        open.push(timeOf(start));
    }
    return open;
}

// Merges whatever the settings row holds over the defaults, so a half-filled row can't break booking.
export function normalizeSettings(row: Partial<BookingSettings> | null | undefined): BookingSettings {
    const s = { ...DEFAULT_SETTINGS, ...(row ?? {}) };
    const weekly = Array.isArray(s.weekly_hours) && s.weekly_hours.length === 7 ? s.weekly_hours : DEFAULT_SETTINGS.weekly_hours;
    return {
        weekly_hours: weekly.map((h) =>
            h && TIME_PATTERN.test(h.open) && TIME_PATTERN.test(h.close) && minutesOf(h.open) < minutesOf(h.close)
                ? { open: h.open, close: h.close }
                : null
        ),
        buffer_minutes: clampInt(s.buffer_minutes, 0, 600, DEFAULT_SETTINGS.buffer_minutes),
        min_notice_hours: clampInt(s.min_notice_hours, 0, 24 * 60, DEFAULT_SETTINGS.min_notice_hours),
        max_advance_days: clampInt(s.max_advance_days, 1, 1000, DEFAULT_SETTINGS.max_advance_days),
        slot_step_minutes: clampInt(s.slot_step_minutes, 5, 240, DEFAULT_SETTINGS.slot_step_minutes),
        capacity: clampInt(s.capacity, 1, 10, DEFAULT_SETTINGS.capacity),
    };
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

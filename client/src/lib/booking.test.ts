import { describe, expect, it } from "vitest";
import {
    BookingError,
    DEFAULT_SETTINGS,
    addDays,
    normalizeSettings,
    openStartTimes,
    quoteBooking,
    weekdayOf,
    zonedParts,
    zonedToUtc,
    type BookingSettings,
} from "./booking";

const settings: BookingSettings = {
    ...DEFAULT_SETTINGS,
    weekly_hours: [null, null, null, null, null, null, { open: "12:00", close: "20:00" }],
    buffer_minutes: 60,
    min_notice_hours: 24,
    slot_step_minutes: 60,
};

// Saturday, November 7, 2026
const SAT = "2026-11-07";
const longAgo = new Date("2026-10-01T12:00:00Z");
const at = (time: string) => zonedToUtc(SAT, time).getTime();

describe("zonedToUtc", () => {
    it("handles daylight and standard time", () => {
        expect(zonedToUtc("2026-07-04", "13:00").toISOString()).toBe("2026-07-04T17:00:00.000Z");
        expect(zonedToUtc("2026-12-05", "13:00").toISOString()).toBe("2026-12-05T18:00:00.000Z");
    });

    it("round-trips through zonedParts", () => {
        expect(zonedParts(zonedToUtc("2026-11-01", "00:30"))).toEqual({ date: "2026-11-01", time: "00:30", weekday: 0 });
        expect(zonedParts(zonedToUtc("2026-03-08", "15:00"))).toEqual({ date: "2026-03-08", time: "15:00", weekday: 0 });
    });

    it("moves times skipped by spring-forward an hour later", () => {
        expect(zonedParts(zonedToUtc("2026-03-08", "02:30")).time).toBe("03:30");
    });

    it("picks the earlier instant on the repeated fall-back hour", () => {
        expect(zonedToUtc("2026-11-01", "01:30").toISOString()).toBe("2026-11-01T05:30:00.000Z");
    });
});

describe("date helpers", () => {
    it("adds days across months and knows weekdays", () => {
        expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
        expect(weekdayOf(SAT)).toBe(6);
    });
});

describe("quoteBooking", () => {
    it("charges only the package deposit and adds add-ons to the balance", () => {
        const q = quoteBooking("gaming-2hr", [
            { id: "karaoke", qty: 1 },
            { id: "laser-tag-addon", qty: 10 },
        ]);
        expect(q.deposit).toBe(275);
        expect(q.total).toBe(550 + 75 + 220);
        expect(q.balance).toBe(q.total - 275);
        expect(q.minutes).toBe(120);
    });

    it("lengthens the party for additional time", () => {
        expect(quoteBooking("gaming-3hr", [{ id: "extra-hour", qty: 2 }]).minutes).toBe(300);
    });

    it("rejects unknown packages, unknown add-ons, duplicates and silly quantities", () => {
        expect(() => quoteBooking("nope", [])).toThrow(BookingError);
        expect(() => quoteBooking("movie", [{ id: "nope", qty: 1 }])).toThrow(BookingError);
        expect(() => quoteBooking("movie", [{ id: "vr", qty: 1 }, { id: "vr", qty: 1 }])).toThrow(BookingError);
        expect(() => quoteBooking("movie", [{ id: "vr", qty: 2 }])).toThrow(BookingError);
        expect(() => quoteBooking("movie", [{ id: "laser-tag-addon", qty: 0 }])).toThrow(BookingError);
    });
});

describe("openStartTimes", () => {
    it("offers every start that fits before closing", () => {
        expect(openStartTimes(SAT, 120, settings, [], longAgo)).toEqual([
            "12:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
            "17:00",
            "18:00",
        ]);
    });

    it("is closed on days without hours", () => {
        expect(openStartTimes("2026-11-06", 120, settings, [], longAgo)).toEqual([]);
    });

    it("keeps a buffer on both sides of an existing party", () => {
        // Party 15:00-17:00, busy until 18:00 with its buffer.
        const busy = [{ start: at("15:00"), end: at("18:00") }];
        // A 2-hour party starting at 13:00 would need until 16:00 including its own buffer.
        expect(openStartTimes(SAT, 120, settings, busy, longAgo)).toEqual(["12:00", "18:00"]);
    });

    it("treats time off as closed", () => {
        const blocked = [{ start: at("00:00"), end: at("23:59") }];
        expect(openStartTimes(SAT, 120, settings, [], longAgo, blocked)).toEqual([]);
    });

    it("allows overlapping parties up to capacity", () => {
        const two = { ...settings, capacity: 2 };
        const busy = [{ start: at("15:00"), end: at("18:00") }];
        expect(openStartTimes(SAT, 120, two, busy, longAgo)).toContain("15:00");
        // Two parties that don't overlap each other don't fill a second crew's slot between them.
        const apart = [
            { start: at("12:00"), end: at("15:00") },
            { start: at("15:00"), end: at("18:00") },
        ];
        expect(openStartTimes(SAT, 120, two, apart, longAgo)).toContain("13:00");
        expect(openStartTimes(SAT, 120, two, [...apart, { start: at("13:00"), end: at("16:00") }], longAgo)).not.toContain(
            "14:00"
        );
    });

    it("respects minimum notice", () => {
        const now = new Date(at("14:30") - 24 * 3600000);
        expect(openStartTimes(SAT, 120, settings, [], now)[0]).toBe("15:00");
    });

    it("respects how far ahead people can book", () => {
        const now = new Date(at("12:00") - 400 * 86400000);
        expect(openStartTimes(SAT, 120, settings, [], now)).toEqual([]);
    });
});

describe("normalizeSettings", () => {
    it("falls back to defaults for missing or broken values", () => {
        const s = normalizeSettings({
            buffer_minutes: "x" as unknown as number,
            weekly_hours: [null, { open: "18:00", close: "09:00" }, null, null, null, null, null],
        });
        expect(s.buffer_minutes).toBe(DEFAULT_SETTINGS.buffer_minutes);
        expect(s.weekly_hours[1]).toBeNull();
        expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    });
});

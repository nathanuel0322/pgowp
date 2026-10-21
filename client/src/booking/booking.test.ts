import { describe, expect, it } from "vitest";
import { quote, QuoteError } from "./quote";
import { busyFor, DEFAULT_SETTINGS, fits, normalizeSettings, startTimes } from "./schedule";
import { addDays, formatRange, utcToZoned, weekdayOf, zonedToUtc } from "./time";

describe("time zone helpers", () => {
    it("converts New York wall time in summer and winter", () => {
        expect(new Date(zonedToUtc("2026-07-04", "14:00")).toISOString()).toBe("2026-07-04T18:00:00.000Z");
        expect(new Date(zonedToUtc("2026-12-19", "14:00")).toISOString()).toBe("2026-12-19T19:00:00.000Z");
    });

    it("handles the days the clocks change", () => {
        // Clocks go back at 2:00 on Nov 1, 2026 and forward at 2:00 on Mar 8, 2026.
        expect(new Date(zonedToUtc("2026-11-01", "18:00")).toISOString()).toBe("2026-11-01T23:00:00.000Z");
        expect(new Date(zonedToUtc("2026-11-01", "00:30")).toISOString()).toBe("2026-11-01T04:30:00.000Z");
        expect(new Date(zonedToUtc("2026-03-08", "12:00")).toISOString()).toBe("2026-03-08T16:00:00.000Z");
    });

    it("round-trips", () => {
        for (const [d, t] of [
            ["2026-10-23", "12:00"],
            ["2026-11-01", "22:30"],
            ["2027-01-01", "00:00"],
        ])
            expect(utcToZoned(zonedToUtc(d, t))).toEqual({ date: d, time: t });
    });

    it("does calendar math", () => {
        expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
        expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
        expect(weekdayOf("2026-10-24")).toBe(6);
        expect(formatRange(zonedToUtc("2026-10-24", "15:30"), zonedToUtc("2026-10-24", "18:30"))).toBe(
            "Sat, Oct 24, 3:30 PM – 6:30 PM"
        );
    });
});

describe("open start times", () => {
    const now = zonedToUtc("2026-10-21", "18:00"); // a Wednesday
    const settings = DEFAULT_SETTINGS;

    it("follows the weekly hours", () => {
        // Saturday 10:00 to 22:00, 3-hour party: the last start is 19:00.
        const sat = startTimes("2026-10-24", 180, settings, [], now);
        expect(sat[0]).toBe("10:00");
        expect(sat.at(-1)).toBe("19:00");
        expect(sat).toHaveLength(19);
        expect(startTimes("2026-10-26", 180, settings, [], now)).toEqual([]); // Monday is closed
    });

    it("needs a day's notice", () => {
        // Thursday 6 PM: Friday starts before 6 PM are too soon.
        const thursday = zonedToUtc("2026-10-22", "18:00");
        expect(startTimes("2026-10-23", 120, settings, [], thursday)[0]).toBe("18:00");
    });

    it("keeps an hour free after each party and allows two at once", () => {
        const one = busyFor(zonedToUtc("2026-10-24", "12:00"), zonedToUtc("2026-10-24", "15:00"), 60);
        // One crew is busy, the other is free all day.
        expect(startTimes("2026-10-24", 180, settings, [one], now)).toHaveLength(19);
        const solo = { ...settings, crews: 1 };
        const times = startTimes("2026-10-24", 180, solo, [one], now);
        // A party plus its hour gap would have to finish by noon, which is too early, so the first start is 16:00,
        // once the noon party's gap is over.
        expect(times).toEqual(["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"]);
        // A 1-hour party fits in the morning: 10:00 to 11:00, then the gap until noon.
        expect(startTimes("2026-10-24", 60, solo, [one], now).slice(0, 2)).toEqual(["10:00", "16:00"]);
    });

    it("counts parties running at the same time, not just overlaps", () => {
        const at = (t: string) => zonedToUtc("2026-10-24", t);
        const morning = { start: at("10:00"), end: at("13:00") };
        const evening = { start: at("15:00"), end: at("18:00") };
        // Overlaps both, but never more than one is running.
        expect(fits(at("12:00"), at("16:00"), [morning, evening], 2)).toBe(true);
        const third = { start: at("12:30"), end: at("14:00") };
        expect(fits(at("12:00"), at("16:00"), [morning, evening, third], 2)).toBe(false);
        // Back-to-back parties don't overlap.
        expect(fits(at("13:00"), at("15:00"), [morning, evening], 1)).toBe(true);
    });

    it("closes blocked-off time for every crew", () => {
        const block = { start: zonedToUtc("2026-10-24", "00:00"), end: zonedToUtc("2026-10-25", "00:00"), all: true };
        expect(startTimes("2026-10-24", 120, settings, [block], now)).toEqual([]);
        expect(startTimes("2026-10-25", 120, settings, [block], now)).not.toEqual([]);
    });

    it("stops at the booking window", () => {
        const s = { ...settings, maxAdvanceDays: 7 };
        expect(startTimes("2026-10-24", 120, s, [], now)).not.toEqual([]);
        expect(startTimes("2026-10-31", 120, s, [], now)).toEqual([]);
    });

    it("cleans up saved settings", () => {
        const s = normalizeSettings({ crews: 0, hours: { "1": { open: "09:00", close: "08:00" }, "2": { open: "09:00", close: "17:00" } } });
        expect(s.crews).toBe(1);
        expect(s.hours["1"]).toBeNull();
        expect(s.hours["2"]).toEqual({ open: "09:00", close: "17:00" });
        expect(s.hours["6"]).toBeNull();
        expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    });
});

describe("pricing", () => {
    it("charges the package deposit and totals the rest", () => {
        const q = quote({ packageId: "gaming-3hr", addOns: ["popcorn", "laser-tag-sessions"], extraHours: 1, guests: 26 });
        expect(q.lines.map((l) => l.amount)).toEqual([700, 20, 150, 175, 572]);
        expect(q.total).toBe(1617);
        expect(q.deposit).toBe(350);
        expect(q.balance).toBe(1267);
        expect(q.minutes).toBe(240);
    });

    it("keeps half-dollar deposits exact", () => {
        const q = quote({ packageId: "movie-gaming", addOns: [], extraHours: 0, guests: 10 });
        expect(q.deposit).toBe(437.5);
        expect(q.balance).toBe(437.5);
    });

    it("rejects what can't be booked", () => {
        const base = { packageId: "laser-tag", addOns: [], extraHours: 0, guests: 12 };
        expect(() => quote({ ...base, packageId: "nope" })).toThrow(QuoteError);
        expect(() => quote({ ...base, guests: 21 })).toThrow(/up to 20/);
        expect(() => quote({ ...base, addOns: ["laser-tag-sessions"] })).toThrow(QuoteError);
        expect(() => quote({ ...base, addOns: ["made-up"] })).toThrow(QuoteError);
        expect(() => quote({ ...base, extraHours: 9 })).toThrow(QuoteError);
        expect(() => quote({ ...base, guests: 0 })).toThrow(QuoteError);
    });
});

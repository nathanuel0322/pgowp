import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { d1Store, type D1Database, type D1PreparedStatement } from "./d1";
import type { NewBooking } from "./server";

// D1 is SQLite, so Node's built-in SQLite stands in for it here and the real SQL gets run.
function sqliteD1(db = new DatabaseSync(":memory:")): D1Database {
    const statement = (sql: string, values: unknown[] = []): D1PreparedStatement => ({
        bind: (...v) => statement(sql, v),
        first: async <T>() => (db.prepare(sql).get(...values) as T) ?? null,
        all: async <T>() => ({ results: db.prepare(sql).all(...values) as T[] }),
        run: async () => db.prepare(sql).run(...values),
    });
    return {
        prepare: (sql) => statement(sql),
        async batch(statements) {
            return Promise.all(statements.map((s) => s.run()));
        },
    };
}

const booking = (start: string, end: string, extra: Partial<NewBooking> = {}): NewBooking => ({
    status: "hold",
    source: "online",
    package_id: "movie-gaming",
    add_ons: ["popcorn", "vr"],
    extra_hours: 1,
    guests: 20,
    start_at: start,
    end_at: end,
    customer_name: "Pat Rivera",
    customer_email: "pat@example.com",
    customer_phone: null,
    address: "123 Main St",
    guest_of_honor: null,
    notes: null,
    admin_notes: null,
    total: 1025.5,
    deposit: 437.5,
    paid: 0,
    refunded: 0,
    stripe_session_id: null,
    stripe_payment_intent: null,
    hold_expires_at: "2026-10-21T22:40:00.000Z",
    ...extra,
});

describe("D1 store", () => {
    it("saves and reads bookings, with money and add-ons intact", async () => {
        const store = d1Store(sqliteD1());
        const saved = await store.insertBooking(booking("2026-10-31T16:00:00.000Z", "2026-10-31T21:00:00.000Z"));
        expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(saved).toMatchObject({ total: 1025.5, deposit: 437.5, paid: 0, add_ons: ["popcorn", "vr"], status: "hold" });
        expect(await store.getBooking(saved.id)).toEqual(saved);
        expect(await store.getBooking("nope")).toBeNull();
    });

    it("finds bookings overlapping a time range, in order", async () => {
        const store = d1Store(sqliteD1());
        await store.insertBooking(booking("2026-11-01T18:00:00.000Z", "2026-11-01T20:00:00.000Z", { customer_name: "Second" }));
        await store.insertBooking(booking("2026-10-31T16:00:00.000Z", "2026-10-31T21:00:00.000Z", { customer_name: "First" }));
        await store.insertBooking(booking("2026-12-01T16:00:00.000Z", "2026-12-01T18:00:00.000Z", { customer_name: "Later" }));
        const found = await store.bookingsBetween(Date.parse("2026-10-31T20:00:00Z"), Date.parse("2026-11-01T18:30:00Z"));
        expect(found.map((b) => b.customer_name)).toEqual(["First", "Second"]);
        // Touching the edge isn't overlapping.
        expect(await store.bookingsBetween(Date.parse("2026-10-31T21:00:00Z"), Date.parse("2026-11-01T18:00:00Z"))).toEqual([]);
    });

    it("only updates a booking from the expected status", async () => {
        const store = d1Store(sqliteD1());
        const b = await store.insertBooking(booking("2026-10-31T16:00:00.000Z", "2026-10-31T21:00:00.000Z"));
        const paid = await store.updateBooking(b.id, { status: "requested", paid: 437.5, hold_expires_at: null }, ["hold"]);
        expect(paid).toMatchObject({ status: "requested", paid: 437.5, hold_expires_at: null, total: 1025.5 });
        // A second payment notice for the same booking changes nothing.
        expect(await store.updateBooking(b.id, { status: "requested", paid: 999 }, ["hold"])).toBeNull();
        expect((await store.getBooking(b.id))!.paid).toBe(437.5);
        // Unknown fields are ignored rather than written into the SQL.
        const moved = await store.updateBooking(b.id, { add_ons: [], "id = 'x'; --": 1 } as never);
        expect(moved).toMatchObject({ id: b.id, add_ons: [] });
        expect(await store.updateBooking("missing", { status: "confirmed" })).toBeNull();
    });

    it("keeps stripe session ids unique", async () => {
        const store = d1Store(sqliteD1());
        await store.insertBooking(booking("2026-10-31T16:00:00.000Z", "2026-10-31T21:00:00.000Z", { stripe_session_id: "cs_1" }));
        await expect(
            store.insertBooking(booking("2026-11-07T16:00:00.000Z", "2026-11-07T21:00:00.000Z", { stripe_session_id: "cs_1" }))
        ).rejects.toThrow();
    });

    it("adds, finds and removes time off", async () => {
        const store = d1Store(sqliteD1());
        const block = await store.insertBlock({ start_at: "2026-11-26T05:00:00.000Z", end_at: "2026-11-27T05:00:00.000Z", reason: "Thanksgiving" });
        expect(block).toMatchObject({ reason: "Thanksgiving" });
        expect(await store.blocksBetween(Date.parse("2026-11-26T12:00:00Z"), Date.parse("2026-11-26T13:00:00Z"))).toEqual([block]);
        await store.deleteBlock(block.id);
        expect(await store.blocksBetween(0, Date.parse("2030-01-01"))).toEqual([]);
    });

    it("saves settings, and creating the tables again keeps the data", async () => {
        const db = new DatabaseSync(":memory:");
        const store = d1Store(sqliteD1(db));
        expect(await store.getSettings()).toBeNull();
        await store.saveSettings({ crews: 2 } as never);
        await store.saveSettings({ crews: 3 } as never);
        expect(await d1Store(sqliteD1(db)).getSettings()).toEqual({ crews: 3 });
    });

    it("explains a missing database binding", async () => {
        await expect(d1Store(undefined).getSettings()).rejects.toThrow(/bound to the site as DB/);
    });
});

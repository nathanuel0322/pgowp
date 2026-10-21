import { beforeEach, describe, expect, it } from "vitest";
import { BookingSettings, DEFAULT_SETTINGS } from "./schedule";
import { BlockRow, BookingRow, CheckoutSession, Deps, Email, handleBookingApi, Store } from "./server";
import { zonedToUtc } from "./time";

// In-memory stand-ins for Supabase, Stripe and Resend.
function fakes(now = zonedToUtc("2026-10-21", "18:00")) {
    const bookings: BookingRow[] = [];
    const blocks: BlockRow[] = [];
    let settings: Partial<BookingSettings> | null = null;
    const sessions = new Map<string, CheckoutSession>();
    const refunds: { paymentIntent: string; amountCents: number }[] = [];
    const emails: Email[] = [];
    let ids = 0;
    const overlaps = (r: { start_at: string; end_at: string }, from: number, to: number) =>
        Date.parse(r.start_at) < to && Date.parse(r.end_at) > from;

    const store: Store = {
        async bookingsBetween(from, to) {
            return bookings.filter((b) => overlaps(b, from, to)).map((b) => ({ ...b }));
        },
        async blocksBetween(from, to) {
            return blocks.filter((b) => overlaps(b, from, to));
        },
        async getBooking(id) {
            const b = bookings.find((x) => x.id === id);
            return b ? { ...b } : null;
        },
        async insertBooking(row) {
            const b = { ...row, id: `b${++ids}`, created_at: new Date(now).toISOString() };
            bookings.push(b);
            return { ...b };
        },
        async updateBooking(id, patch, fromStatuses) {
            const b = bookings.find((x) => x.id === id);
            if (!b || (fromStatuses && !fromStatuses.includes(b.status))) return null;
            Object.assign(b, patch);
            return { ...b };
        },
        async insertBlock(row) {
            const b = { ...row, id: `x${++ids}`, created_at: "" };
            blocks.push(b);
            return b;
        },
        async deleteBlock(id) {
            blocks.splice(blocks.findIndex((b) => b.id === id), 1);
        },
        async getSettings() {
            return settings;
        },
        async saveSettings(s) {
            settings = s;
        },
    };

    const deps: Deps = {
        store,
        payments: {
            async createCheckout(p) {
                const s: CheckoutSession = {
                    id: `cs_test_${p.bookingId}`,
                    url: `https://checkout.stripe.test/${p.bookingId}`,
                    payment_status: "unpaid",
                    amount_total: p.amountCents,
                    payment_intent: null,
                    metadata: { booking_id: p.bookingId },
                };
                sessions.set(s.id, s);
                return s;
            },
            async getCheckout(id) {
                const s = sessions.get(id);
                if (!s) throw new Error("no such session");
                return s;
            },
            async refund(paymentIntent, amountCents) {
                refunds.push({ paymentIntent, amountCents });
            },
            async webhookEvent(body, signature) {
                if (signature !== "good") throw new Error("bad signature");
                return JSON.parse(body);
            },
        },
        async sendEmail(email) {
            emails.push(email);
        },
        async adminFromToken(token) {
            return token === "admin-token" ? { email: "tbnd@prestigiousgamingonwheelsplus.com" } : { error: "Nope", status: 403 };
        },
        async verifyHuman(token) {
            return token === "human";
        },
        now: () => now,
        env: { CALENDAR_TOKEN: "cal-secret" },
    };

    const pay = (bookingId: string) => {
        const s = sessions.get(`cs_test_${bookingId}`)!;
        s.payment_status = "paid";
        s.payment_intent = `pi_${bookingId}`;
    };

    return { deps, bookings, blocks, sessions, refunds, emails, pay };
}

const api = (deps: Deps, path: string, init: RequestInit & { json?: unknown } = {}) => {
    const { json, ...rest } = init;
    return handleBookingApi(
        new Request(`https://prestigiousgamingonwheelsplus.com${path}`, {
            ...rest,
            headers: { ...(json ? { "Content-Type": "application/json" } : {}), ...(rest.headers as Record<string, string>) },
            body: json ? JSON.stringify(json) : rest.body,
        }),
        {},
        deps
    );
};

const party = {
    packageId: "gaming-3hr",
    addOns: ["popcorn"],
    extraHours: 0,
    guests: 20,
    date: "2026-10-24",
    time: "12:00",
    name: "Pat Rivera",
    email: "pat@example.com",
    phone: "(718) 555-0100",
    address: "123 Main St, Queens, NY 11434",
    guestOfHonor: "Sam",
    notes: "Driveway on the left",
    agree: true,
    turnstileToken: "human",
};

const admin = { Authorization: "Bearer admin-token" };

describe("booking API", () => {
    let f: ReturnType<typeof fakes>;
    beforeEach(() => {
        f = fakes();
    });

    it("lists open start times for a month", async () => {
        const res = await api(f.deps, "/api/booking/availability?package=gaming-3hr&month=2026-10");
        expect(res.status).toBe(200);
        const body = await res.json();
        // Today is Wednesday Oct 21; Friday the 23rd onward is bookable.
        expect(Object.keys(body.days)).toEqual(["2026-10-23", "2026-10-24", "2026-10-25", "2026-10-30", "2026-10-31"]);
        expect(body.days["2026-10-25"]).toEqual(["17:30", "18:00", "18:30", "19:00", "19:30"]);
    });

    it("takes a deposit, holds the slot, and turns it into a request once paid", async () => {
        const res = await api(f.deps, "/api/booking/checkout", { method: "POST", json: party });
        expect(res.status).toBe(200);
        expect((await res.json()).url).toBe("https://checkout.stripe.test/b1");
        const [hold] = f.bookings;
        expect(hold).toMatchObject({ status: "hold", total: 875, deposit: 350, paid: 0 });
        expect(hold.start_at).toBe("2026-10-24T16:00:00.000Z");
        expect(hold.end_at).toBe("2026-10-24T19:00:00.000Z");
        expect(f.sessions.get("cs_test_b1")!.amount_total).toBe(35000);

        // With two crews, one more customer can book the same time, but a third can't.
        const second = await api(f.deps, "/api/booking/checkout", { method: "POST", json: party });
        expect(second.status).toBe(200);
        const third = await api(f.deps, "/api/booking/checkout", { method: "POST", json: party });
        expect(third.status).toBe(409);
        expect((await third.json()).code).toBe("slot_taken");

        // Coming back from Stripe before paying changes nothing.
        let confirm = await api(f.deps, "/api/booking/confirm?session_id=cs_test_b1");
        expect((await confirm.json()).status).toBe("hold");
        expect(f.emails).toHaveLength(0);

        f.pay("b1");
        confirm = await api(f.deps, "/api/booking/confirm?session_id=cs_test_b1");
        expect(await confirm.json()).toMatchObject({ status: "requested", paid: 350, balance: 525, firstName: "Pat" });
        expect(f.bookings[0]).toMatchObject({ status: "requested", paid: 350, stripe_payment_intent: "pi_b1" });
        expect(f.emails.map((e) => e.to)).toEqual(["pat@example.com", "tbnd@prestigiousgamingonwheelsplus.com"]);

        // The webhook arriving afterwards doesn't send the emails twice.
        const hook = await api(f.deps, "/api/stripe-webhook", {
            method: "POST",
            headers: { "Stripe-Signature": "good" },
            body: JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_test_b1" } } }),
        });
        expect(hook.status).toBe(200);
        expect(f.emails).toHaveLength(2);
    });

    it("rejects bad webhooks and expired holds stop blocking", async () => {
        const hook = await api(f.deps, "/api/stripe-webhook", {
            method: "POST",
            headers: { "Stripe-Signature": "forged" },
            body: "{}",
        });
        expect(hook.status).toBe(400);

        const solo = fakes();
        await solo.deps.store.saveSettings({ ...DEFAULT_SETTINGS, crews: 1 });
        await api(solo.deps, "/api/booking/checkout", { method: "POST", json: party });
        expect((await api(solo.deps, "/api/booking/checkout", { method: "POST", json: party })).status).toBe(409);
        solo.bookings[0].hold_expires_at = new Date(solo.deps.now() - 1000).toISOString();
        expect((await api(solo.deps, "/api/booking/checkout", { method: "POST", json: party })).status).toBe(200);
    });

    it("validates the customer's details", async () => {
        const post = (json: object) => api(f.deps, "/api/booking/checkout", { method: "POST", json: { ...party, ...json } });
        expect((await post({ email: "nope" })).status).toBe(400);
        expect((await post({ phone: "123" })).status).toBe(400);
        expect((await post({ address: "" })).status).toBe(400);
        expect((await post({ agree: false })).status).toBe(400);
        expect((await post({ guests: 99 })).status).toBe(400);
        expect((await post({ time: "08:00" })).status).toBe(409); // before opening
        expect((await post({ turnstileToken: "bot" })).status).toBe(403);
        expect(f.bookings).toHaveLength(0);
    });

    it("keeps admin routes behind sign-in", async () => {
        expect((await api(f.deps, "/api/admin/bookings")).status).toBe(401);
        expect((await api(f.deps, "/api/admin/bookings", { headers: { Authorization: "Bearer someone" } })).status).toBe(403);
        expect((await api(f.deps, "/api/admin/bookings", { headers: admin })).status).toBe(200);
    });

    it("lets the owner confirm, decline with a refund, and cancel", async () => {
        await api(f.deps, "/api/booking/checkout", { method: "POST", json: party });
        await api(f.deps, "/api/booking/checkout", { method: "POST", json: { ...party, time: "16:00" } });
        f.pay("b1");
        f.pay("b2");
        await api(f.deps, "/api/booking/confirm?session_id=cs_test_b1");
        await api(f.deps, "/api/booking/confirm?session_id=cs_test_b2");
        f.emails.length = 0;

        const list = await (await api(f.deps, "/api/admin/bookings", { headers: admin })).json();
        expect(list.bookings.map((b: BookingRow) => b.status)).toEqual(["requested", "requested"]);

        const patch = (id: string, json: object) => api(f.deps, `/api/admin/bookings/${id}`, { method: "PATCH", headers: admin, json });
        expect((await patch("b1", { action: "confirm" })).status).toBe(200);
        expect(f.bookings[0].status).toBe("confirmed");
        expect(f.emails[0].subject).toMatch(/confirmed/);
        expect(f.emails[0].attachments?.[0].filename).toBe("party.ics");
        expect((await patch("b1", { action: "confirm" })).status).toBe(409);

        expect((await patch("b2", { action: "decline", message: "We're booked that day." })).status).toBe(200);
        expect(f.refunds).toEqual([{ paymentIntent: "pi_b2", amountCents: 35000 }]);
        expect(f.bookings[1]).toMatchObject({ status: "declined", refunded: 350 });
        expect(f.emails[1].html).toContain("We&#39;re booked that day.");

        // Cancelling without a refund keeps the deposit (inside the 48-hour policy).
        expect((await patch("b1", { action: "cancel", refund: false })).status).toBe(200);
        expect(f.refunds).toHaveLength(1);
        expect(f.bookings[0].status).toBe("cancelled");
    });

    it("adds phone bookings, warns about clashes, and moves bookings", async () => {
        const add = (json: object) => api(f.deps, "/api/admin/bookings", { method: "POST", headers: admin, json });
        const phone = { ...party, email: "", phone: "", address: "", agree: undefined, paid: 100, adminNotes: "Paid by Zelle" };
        expect((await add(phone)).status).toBe(201);
        expect(f.bookings[0]).toMatchObject({ status: "confirmed", source: "admin", paid: 100, customer_email: null });
        expect((await add(phone)).status).toBe(201); // second crew
        const clash = await add(phone);
        expect(clash.status).toBe(409);
        expect((await clash.json()).code).toBe("conflict");
        expect((await add({ ...phone, force: true })).status).toBe(201);

        const move = await api(f.deps, "/api/admin/bookings/b1", {
            method: "PATCH",
            headers: admin,
            json: { ...phone, action: "update", time: "17:00", extraHours: 1 },
        });
        expect(move.status).toBe(200);
        expect(f.bookings[0]).toMatchObject({ start_at: "2026-10-24T21:00:00.000Z", end_at: "2026-10-25T01:00:00.000Z", total: 1025, paid: 100 });
    });

    it("blocks time off and saves hours", async () => {
        const block = await api(f.deps, "/api/admin/blocks", {
            method: "POST",
            headers: admin,
            json: { startDate: "2026-10-24", endDate: "2026-10-25", reason: "Family trip" },
        });
        expect(block.status).toBe(201);
        expect(f.blocks[0]).toMatchObject({ start_at: "2026-10-24T04:00:00.000Z", end_at: "2026-10-26T04:00:00.000Z" });
        const days = (await (await api(f.deps, "/api/booking/availability?package=gaming-2hr&month=2026-10")).json()).days;
        expect(Object.keys(days)).toEqual(["2026-10-23", "2026-10-30", "2026-10-31"]);

        const hours = { ...DEFAULT_SETTINGS.hours, "4": { open: "15:00", close: "20:00" } };
        const saved = await api(f.deps, "/api/admin/settings", {
            method: "PUT",
            headers: admin,
            json: { settings: { ...DEFAULT_SETTINGS, hours } },
        });
        expect(saved.status).toBe(200);
        const after = (await (await api(f.deps, "/api/booking/availability?package=gaming-2hr&month=2026-10")).json()).days;
        expect(after["2026-10-29"]).toEqual(["15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"]);

        expect((await api(f.deps, `/api/admin/blocks/${f.blocks[0].id}`, { method: "DELETE", headers: admin })).status).toBe(204);
        expect(f.blocks).toHaveLength(0);
    });

    it("serves a private calendar feed", async () => {
        await api(f.deps, "/api/admin/bookings", {
            method: "POST",
            headers: admin,
            json: { ...party, notes: "Gate code 1234; ring twice" },
        });
        expect((await api(f.deps, "/api/calendar.ics?token=wrong")).status).toBe(404);
        const feed = await api(f.deps, "/api/calendar.ics?token=cal-secret");
        expect(feed.headers.get("Content-Type")).toMatch(/text\/calendar/);
        const ics = await feed.text();
        expect(ics).toContain("DTSTART:20261024T160000Z");
        expect(ics).toContain("SUMMARY:3-Hour Gaming Party – Pat Rivera");
        expect(ics).toContain("Gate code 1234\\; ring twice");
    });

    it("answers CORS preflight for the dev site only", async () => {
        const res = await handleBookingApi(
            new Request("https://x/api/booking/checkout", { method: "OPTIONS", headers: { Origin: "http://localhost:5173" } }),
            {},
            f.deps
        );
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
        const evil = await handleBookingApi(
            new Request("https://x/api/booking/checkout", { method: "OPTIONS", headers: { Origin: "https://evil.test" } }),
            {},
            f.deps
        );
        expect(evil.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
});

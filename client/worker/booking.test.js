// Tests for the booking worker (worker/booking.js, reached through public/_worker.js) and the rules it imports from
// src/lib/booking.ts. Nothing here touches the network or a real key:
// - D1 is an in-memory SQLite database (better-sqlite3) built from ../migrations.
// - Stripe is a fake for Checkout Sessions. Webhook signatures are made and checked by the real Stripe library with a
//   test secret, so a bad signature is rejected the same way it is live.
// - Resend records emails instead of sending them, and Turnstile is answered by a stubbed fetch.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, zonedToUtc } from "../src/lib/booking.ts";
import { DEFAULT_CATALOG } from "../src/lib/catalog.ts";

const fakes = vi.hoisted(() => ({
    stripeKeys: [],
    sessions: new Map(),
    sessionCount: 0,
    createCalls: [],
    emails: [],
    emailError: null,
}));

vi.mock("stripe", async (importOriginal) => {
    const Real = (await importOriginal()).default;
    // Only used for its webhooks helper, which verifies signatures locally and never calls Stripe.
    const realWebhooks = new Real("sk_test_unused").webhooks;
    const sessions = {
        async create(params) {
            fakes.createCalls.push(params);
            const id = `cs_test_${++fakes.sessionCount}`;
            const session = {
                id,
                object: "checkout.session",
                url: `https://checkout.stripe.test/${id}`,
                status: "open",
                payment_status: "unpaid",
                amount_total: params.line_items.reduce((sum, l) => sum + l.price_data.unit_amount * l.quantity, 0),
                metadata: params.metadata,
                payment_intent: null,
            };
            fakes.sessions.set(id, session);
            return { ...session };
        },
        async retrieve(id) {
            const session = fakes.sessions.get(id);
            if (!session) throw new Error(`No such checkout.session: ${id}`);
            return { ...session };
        },
        async expire(id) {
            const session = fakes.sessions.get(id);
            if (!session || session.status !== "open") throw new Error("Only open sessions can be expired");
            session.status = "expired";
            return { ...session };
        },
    };
    class FakeStripe {
        constructor(key) {
            fakes.stripeKeys.push(key);
            this.checkout = { sessions };
            this.webhooks = realWebhooks;
        }
        static createFetchHttpClient = () => ({});
        static createSubtleCryptoProvider = Real.createSubtleCryptoProvider;
    }
    return { default: FakeStripe, Stripe: FakeStripe };
});

vi.mock("resend", () => ({
    Resend: class {
        constructor(key) {
            this.emails = {
                send: async (message) => {
                    if (fakes.emailError) return { data: null, error: fakes.emailError };
                    fakes.emails.push({ key, ...message });
                    return { data: { id: `email_${fakes.emails.length}` }, error: null };
                },
            };
        }
    },
}));

const { default: worker } = await import("../public/_worker.js");

const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), "../migrations");
const WEBHOOK_SECRET = "whsec_test_secret";
const MIN = 60000;
const HOUR = 60 * MIN;

// ---- D1 on SQLite ----------------------------------------------------------------------------------------------
// Enough of the D1 API for the worker: prepare/bind/first/all/run and batch, with D1's ?1-style numbered parameters.
function d1(sqlite) {
    const exec = (sql, args) => {
        const statement = sqlite.prepare(sql);
        const params = args.length ? [Object.fromEntries(args.map((v, i) => [i + 1, v]))] : [];
        if (statement.reader) return { results: statement.all(...params), changes: 0 };
        const { changes } = statement.run(...params);
        return { results: [], changes };
    };
    const statement = (sql, args = []) => ({
        bind: (...values) => statement(sql, values),
        first: async () => exec(sql, args).results[0] ?? null,
        all: async () => ({ success: true, results: exec(sql, args).results }),
        run: async () => {
            const { changes } = exec(sql, args);
            return { success: true, meta: { changes } };
        },
        _exec: () => exec(sql, args),
    });
    return {
        prepare: (sql) => statement(sql),
        batch: async (statements) => sqlite.transaction(() => statements.map((s) => ({ success: true, results: s._exec().results })))(),
    };
}

let sqlite;
let env;

function freshDatabase() {
    const db = new Database(":memory:");
    for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
        db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
    }
    return db;
}

function baseEnv(overrides = {}) {
    return {
        DB: d1(sqlite),
        RESEND_KEY: "re_test_key",
        TURNSTILE_SECRET: "turnstile-test-secret",
        STRIPE_SECRET_KEY: "sk_test_fake",
        STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
        BOOKING_SECRET: "booking-test-secret",
        ADMIN_PASSWORD: "test-password",
        ...overrides,
    };
}

// Turnstile answers "pass" tokens with success. Anything else that tries the network fails the test.
const fetchStub = vi.fn(async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url === "https://challenges.cloudflare.com/turnstile/v0/siteverify") {
        const token = init.body.get("response");
        const ok = init.body.get("secret") === "turnstile-test-secret" && token === "pass";
        return new Response(JSON.stringify({ success: ok, "error-codes": ok ? [] : ["invalid-input-response"] }));
    }
    throw new Error(`Unexpected network call in a test: ${url}`);
});

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // Thursday 5 November 2026, 10:00 in New York.
    vi.setSystemTime(new Date("2026-11-05T15:00:00Z"));
    vi.stubGlobal("fetch", fetchStub);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fakes.stripeKeys.length = 0;
    fakes.sessions.clear();
    fakes.sessionCount = 0;
    fakes.createCalls.length = 0;
    fakes.emails.length = 0;
    fakes.emailError = null;
    sqlite = freshDatabase();
    env = baseEnv();
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fetchStub.mockClear();
    sqlite.close();
});

// ---- Helpers -----------------------------------------------------------------------------------------------------

async function call(path, { method = "GET", body, headers = {}, env: callEnv = env } = {}) {
    const init = { method, headers: { ...headers } };
    if (body !== undefined) {
        init.body = typeof body === "string" ? body : JSON.stringify(body);
        if (typeof body !== "string") init.headers["Content-Type"] = "application/json";
    }
    const res = await worker.fetch(new Request(`https://prestigiousgamingonwheelsplus.com${path}`, init), callEnv);
    const raw = await res.text();
    let json = null;
    try {
        json = raw ? JSON.parse(raw) : null;
    } catch {
        json = raw;
    }
    return { status: res.status, body: json };
}

// Friday 20 November 2026: open 12:00 to 22:30 by default.
const FRIDAY = "2026-11-20";
// Saturday 21 November 2026: open 10:00 to 23:45 by default.
const SATURDAY = "2026-11-21";
const THURSDAY = "2026-11-19";

const checkoutBody = (overrides = {}) => ({
    package: "gaming-2hr",
    addOns: [],
    date: FRIDAY,
    time: "14:00",
    name: "Pat Lee",
    email: "pat@example.com",
    phone: "(718) 555-0100",
    address: "123 Main St, Queens, NY 11101",
    place_id: "ChIJtestPlace12345",
    notes: "",
    turnstile_token: "pass",
    ...overrides,
});

const checkout = (overrides, options) => call("/api/booking/checkout", { method: "POST", body: checkoutBody(overrides), ...options });

const availability = async (month, pkg = "gaming-2hr", addons = "") => {
    const res = await call(`/api/booking/availability?package=${pkg}&month=${month}${addons ? `&addons=${addons}` : ""}`);
    expect(res.status).toBe(200);
    return res.body;
};

const bookings = () => sqlite.prepare("SELECT * FROM bookings ORDER BY created_at, id").all();
const bookingById = (id) => sqlite.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
const nyTime = (date, time) => zonedToUtc(date, time).getTime();

function saveSettings(patch) {
    sqlite
        .prepare("INSERT OR REPLACE INTO booking_settings (id, data, updated_at) VALUES (1, ?, 0)")
        .run(JSON.stringify({ ...DEFAULT_SETTINGS, ...patch }));
}

function saveCatalog(catalog) {
    sqlite.prepare("INSERT OR REPLACE INTO catalog (id, data, updated_at) VALUES (1, ?, 0)").run(JSON.stringify(catalog));
}

// A booking straight into the table, as /admin or an earlier checkout would leave it.
function insertBooking({
    date,
    time,
    minutes = 120,
    buffer = 60,
    status = "confirmed",
    created_at = Date.now() - 7 * 24 * HOUR,
    hold_expires_at = null,
    customer_email = "guest@example.com",
    ...rest
}) {
    const starts = nyTime(date, time);
    const row = {
        id: crypto.randomUUID(),
        created_at,
        updated_at: created_at,
        status,
        package_id: "gaming-2hr",
        package_name: "2-Hour Gaming Party",
        starts_at: starts,
        ends_at: starts + minutes * MIN,
        blocked_until: starts + (minutes + buffer) * MIN,
        customer_name: "Sam Guest",
        customer_email,
        customer_phone: "7185550101",
        address: "1 Test Ave, Queens, NY",
        total_cents: 55000,
        deposit_cents: 27500,
        paid_cents: 27500,
        hold_expires_at,
        ...rest,
    };
    const keys = Object.keys(row);
    sqlite.prepare(`INSERT INTO bookings (${keys.join(", ")}) VALUES (${keys.map((k) => `@${k}`).join(", ")})`).run(row);
    return row;
}

function paySession(id, extra = {}) {
    const session = fakes.sessions.get(id);
    Object.assign(session, { status: "complete", payment_status: "paid", payment_intent: `pi_for_${id}`, ...extra });
    return { ...session };
}

async function signedWebhook(event, { secret = WEBHOOK_SECRET, tamper } = {}) {
    const Stripe = (await vi.importActual("stripe")).default;
    const payload = JSON.stringify(event);
    const signature = await new Stripe("sk_test_unused").webhooks.generateTestHeaderStringAsync({ payload, secret });
    return call("/api/stripe/webhook", {
        method: "POST",
        body: tamper ? tamper(payload) : payload,
        headers: { "Stripe-Signature": signature, "Content-Type": "application/json" },
    });
}

const sessionEvent = (type, session) => ({
    id: `evt_${Math.random().toString(36).slice(2)}`,
    object: "event",
    type,
    data: { object: session },
});

// Starts a checkout and returns the pending booking and its Stripe session.
async function startCheckout(overrides) {
    const res = await checkout(overrides);
    expect(res.status).toBe(200);
    const sessionId = res.body.url.split("/").pop();
    const booking = sqlite.prepare("SELECT * FROM bookings WHERE stripe_session_id = ?").get(sessionId);
    return { booking, sessionId };
}

const confirmationEmails = () => fakes.emails.filter((e) => /is booked$|^New booking:/.test(e.subject));
const reminderEmails = () => fakes.emails.filter((e) => e.subject.startsWith("Reminder:"));

// =================================================================================================================

describe("slot holds", () => {
    it("holds the slot for 35 minutes as a pending booking", async () => {
        const start = Date.now();
        const { booking } = await startCheckout();
        expect(booking.status).toBe("pending");
        expect(booking.hold_expires_at).toBe(start + 35 * MIN);
        expect(booking.starts_at).toBe(nyTime(FRIDAY, "14:00"));
        expect(booking.ends_at).toBe(nyTime(FRIDAY, "16:00"));
        // The Checkout Session closes before the hold does.
        expect(fakes.createCalls[0].expires_at).toBe(Math.floor(start / 1000) + 31 * 60);
        expect(fakes.createCalls[0].expires_at * 1000).toBeLessThan(booking.hold_expires_at);
    });

    it("keeps the slot taken until the hold runs out, then frees it", async () => {
        const start = Date.now();
        const { booking } = await startCheckout();

        vi.setSystemTime(start + 35 * MIN - 1000);
        expect((await availability("2026-11")).days[FRIDAY]).not.toContain("14:00");
        expect((await checkout({ email: "other@example.com" })).status).toBe(409);

        vi.setSystemTime(start + 35 * MIN);
        expect((await availability("2026-11")).days[FRIDAY]).toContain("14:00");

        vi.setSystemTime(start + 35 * MIN + 1000);
        const second = await checkout({ email: "other@example.com" });
        expect(second.status).toBe(200);
        // The lapsed hold is marked expired and no longer counts.
        expect(bookingById(booking.id).status).toBe("expired");
        expect(bookings().filter((b) => b.status === "pending")).toHaveLength(1);
    });

    it("frees the slot straight away when the customer backs out of Checkout", async () => {
        const { booking, sessionId } = await startCheckout();
        const res = await call("/api/booking/release", { method: "POST", body: { booking_id: booking.id } });
        expect(res.body).toEqual({ released: true });
        expect(bookingById(booking.id).status).toBe("expired");
        expect(fakes.sessions.get(sessionId).status).toBe("expired");
        expect((await availability("2026-11")).days[FRIDAY]).toContain("14:00");
    });

    it("confirms instead of releasing when the customer had already paid", async () => {
        const { booking, sessionId } = await startCheckout();
        paySession(sessionId);
        const res = await call("/api/booking/release", { method: "POST", body: { booking_id: booking.id } });
        expect(res.body).toEqual({ released: false });
        expect(bookingById(booking.id).status).toBe("confirmed");
        expect(confirmationEmails()).toHaveLength(2);
    });
});

describe("overlap, capacity and the gap between parties", () => {
    it("offers every start time that fits inside the day's hours when nothing is booked", async () => {
        const { days, minutes } = await availability("2026-11");
        expect(minutes).toBe(120);
        // Friday: 12:00 to 22:30, so a two-hour party starts by 20:30, every 30 minutes.
        expect(days[FRIDAY][0]).toBe("12:00");
        expect(days[FRIDAY].at(-1)).toBe("20:30");
        expect(days[FRIDAY]).toHaveLength(18);
        // Saturday: 10:00 to 23:45.
        expect(days[SATURDAY][0]).toBe("10:00");
        expect(days[SATURDAY].at(-1)).toBe("21:30");
    });

    it("keeps the buffer free after a party and lets the next one start right after it", async () => {
        // 15:00 to 17:00 with a 60-minute buffer: busy until 18:00.
        insertBooking({ date: SATURDAY, time: "15:00" });
        const times = (await availability("2026-11")).days[SATURDAY];
        // An earlier party needs its own buffer to end by 15:00: start 12:00 at the latest.
        expect(times).toContain("12:00");
        expect(times).not.toContain("12:30");
        expect(times.filter((t) => t > "12:00" && t < "18:00")).toEqual([]);
        expect(times).toContain("18:00");

        expect((await checkout({ date: SATURDAY, time: "17:30" })).status).toBe(409);
        expect((await checkout({ date: SATURDAY, time: "12:30" })).status).toBe(409);
        expect((await checkout({ date: SATURDAY, time: "18:00" })).status).toBe(200);
    });

    it("uses the saved gap between parties and stores it on the booking", async () => {
        saveSettings({ buffer_minutes: 0 });
        insertBooking({ date: SATURDAY, time: "15:00", buffer: 0 });
        const times = (await availability("2026-11")).days[SATURDAY];
        expect(times).toContain("13:00");
        expect(times).toContain("17:00");
        expect(times).not.toContain("16:30");

        saveSettings({ buffer_minutes: 90 });
        const { booking } = await startCheckout({ date: SATURDAY, time: "19:00" });
        expect(booking.blocked_until - booking.ends_at).toBe(90 * MIN);
    });

    it("counts longer parties from add-ons that add time", async () => {
        insertBooking({ date: SATURDAY, time: "15:00" });
        const { days, minutes } = await availability("2026-11", "gaming-2hr", "extra-hour:1");
        expect(minutes).toBe(180);
        // Three hours plus the buffer has to end by 15:00.
        expect(days[SATURDAY]).toContain("11:00");
        expect(days[SATURDAY]).not.toContain("11:30");
    });

    it("allows as many overlapping parties as the capacity, and no more", async () => {
        saveSettings({ capacity: 2 });
        insertBooking({ date: FRIDAY, time: "14:00" });
        expect((await availability("2026-11")).days[FRIDAY]).toContain("14:00");
        expect((await checkout({ time: "15:00" })).status).toBe(200);
        // 14:00 to 17:00 and 15:00 to 18:00 are both busy at 15:30.
        expect((await availability("2026-11")).days[FRIDAY]).not.toContain("15:30");
        expect((await checkout({ time: "15:30", email: "third@example.com" })).status).toBe(409);
        // After the first one's buffer, one crew is free again.
        expect((await checkout({ time: "17:00", email: "fourth@example.com" })).status).toBe(200);
    });

    it("doesn't count back-to-back parties as overlapping each other", async () => {
        saveSettings({ capacity: 2 });
        // 14:00 to 17:00 (with buffer) and 17:00 to 20:00 never run at the same time, so a crew is still free from 15:00.
        insertBooking({ date: FRIDAY, time: "14:00" });
        insertBooking({ date: FRIDAY, time: "17:00" });
        const times = (await availability("2026-11")).days[FRIDAY];
        expect(times).toContain("15:00");
        expect((await checkout({ time: "15:00" })).status).toBe(200);
    });

    it("doesn't count cancelled or expired bookings", async () => {
        insertBooking({ date: FRIDAY, time: "14:00", status: "cancelled" });
        insertBooking({ date: FRIDAY, time: "14:00", status: "expired" });
        expect((await availability("2026-11")).days[FRIDAY]).toContain("14:00");
    });

    it("blocks time off", async () => {
        sqlite
            .prepare("INSERT INTO blocked_times (id, created_at, starts_at, ends_at) VALUES ('off', 0, ?, ?)")
            .run(nyTime(FRIDAY, "00:00"), nyTime("2026-11-21", "00:00"));
        expect((await availability("2026-11")).days[FRIDAY]).toBeUndefined();
        expect((await checkout()).status).toBe(409);
    });

    it("lets exactly one of two customers racing for the same slot keep it", async () => {
        const results = await Promise.all([checkout({ email: "a@example.com" }), checkout({ email: "b@example.com" })]);
        expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
        expect(bookings()).toHaveLength(1);
        expect(fakes.createCalls).toHaveLength(1);
    });

    it("refuses parties sooner than the minimum notice", async () => {
        // Now is Thursday 10:00; Friday 6 November at 09:59 would be inside 24 hours.
        vi.setSystemTime(new Date("2026-11-05T17:30:00Z"));
        const days = (await availability("2026-11")).days;
        expect(days["2026-11-06"][0]).toBe("12:30");
        expect((await checkout({ date: "2026-11-06", time: "12:00" })).status).toBe(409);
    });
});

describe("Thursdays", () => {
    it("are closed in the default and saved settings", async () => {
        expect(DEFAULT_SETTINGS.weekly_hours[4]).toBeNull();
        const { days } = await availability("2026-12");
        const weekdays = Object.keys(days).map((d) => new Date(`${d}T12:00:00Z`).getUTCDay());
        expect(weekdays.length).toBeGreaterThan(0);
        expect(weekdays).not.toContain(4);
        // Only Friday, Saturday and Sunday are open by default.
        expect(new Set(weekdays)).toEqual(new Set([0, 5, 6]));
    });

    it("can't be booked through checkout", async () => {
        const res = await checkout({ date: THURSDAY, time: "14:00" });
        expect(res.status).toBe(409);
        expect(bookings()).toHaveLength(0);
        expect(fakes.createCalls).toHaveLength(0);
    });

    it("stay closed when the owner saves hours on /admin", async () => {
        const login = await call("/api/admin/login", { method: "POST", body: { password: "test-password", turnstile_token: "pass" } });
        expect(login.status).toBe(200);
        const weekly = DEFAULT_SETTINGS.weekly_hours.map((h) => h ?? null);
        weekly[1] = { open: "15:00", close: "21:00" };
        const saved = await call("/api/admin/settings", {
            method: "PUT",
            body: { ...DEFAULT_SETTINGS, weekly_hours: weekly },
            headers: { Authorization: `Bearer ${login.body.token}` },
        });
        expect(saved.status).toBe(200);
        expect(saved.body.settings.weekly_hours[4]).toBeNull();
        expect((await availability("2026-11")).days[THURSDAY]).toBeUndefined();
        expect((await availability("2026-11")).days["2026-11-16"]).toBeDefined();
    });
});

describe("checkout input", () => {
    it.each([
        ["missing", undefined],
        ["empty", ""],
        ["too short", "ChIJ"],
        ["not a place id", "<script>x</script>"],
    ])("is refused when the place_id is %s", async (_, placeId) => {
        const res = await checkout({ place_id: placeId });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Google Maps suggestions/);
        expect(bookings()).toHaveLength(0);
        expect(fakes.createCalls).toHaveLength(0);
    });

    it("is refused when the spam check fails", async () => {
        expect((await checkout({ turnstile_token: "bot" })).status).toBe(403);
        expect((await checkout({ turnstile_token: "" })).status).toBe(403);
        expect(bookings()).toHaveLength(0);
    });

    it.each([
        ["package", { package: "nope" }],
        ["date", { date: "2026-13-01" }],
        ["time", { time: "25:00" }],
        ["name", { name: "   " }],
        ["email", { email: "not-an-email" }],
        ["phone", { phone: "555-0100" }],
        ["address", { address: "Queens" }],
        ["add-on", { addOns: [{ id: "made-up", qty: 1 }] }],
    ])("is refused with a bad %s", async (_, overrides) => {
        expect((await checkout(overrides)).status).toBe(400);
        expect(bookings()).toHaveLength(0);
    });

    it("rejects a body that isn't JSON", async () => {
        expect((await call("/api/booking/checkout", { method: "POST", body: "not json" })).status).toBe(400);
    });
});

describe("amounts come from IDs only", () => {
    it("ignores prices, totals and deposits sent by the browser", async () => {
        const res = await checkout({
            total: 1,
            deposit: 0.5,
            price: 1,
            amount: 50,
            total_cents: 1,
            deposit_cents: 1,
            paid_cents: 999999,
            status: "confirmed",
            addOns: [{ id: "vr", qty: 1, price: 0, unitPrice: 0, total: 0, name: "Free stuff" }],
        });
        expect(res.status).toBe(200);
        const [booking] = bookings();
        expect(booking.status).toBe("pending");
        expect(booking.total_cents).toBe(55000 + 8000);
        expect(booking.deposit_cents).toBe(27500);
        expect(booking.paid_cents).toBe(0);
        expect(JSON.parse(booking.add_ons)).toEqual([
            { id: "vr", name: "Virtual reality (ages 10+)", unitPrice: 80, qty: 1, total: 80 },
        ]);

        const [params] = fakes.createCalls;
        expect(params.line_items).toHaveLength(1);
        expect(params.line_items[0].price_data.unit_amount).toBe(27500);
        expect(params.line_items[0].price_data.currency).toBe("usd");
        expect(params.line_items[0].price_data.product_data.description).toContain("The remaining $355 is paid on the day");
        expect(params.line_items[0].price_data.product_data.description).toContain("preferably in cash");
    });

    it("prices quantities and per-child add-ons on the server", async () => {
        await checkout({
            package: "gaming-3hr",
            time: "13:00",
            addOns: [
                { id: "laser-tag-addon", qty: 10.9, total: 1 },
                { id: "extra-hour", qty: 2 },
            ],
        });
        const [booking] = bookings();
        // 700 + 22 × 10 + 150 × 2
        expect(booking.total_cents).toBe((700 + 220 + 300) * 100);
        expect(booking.ends_at - booking.starts_at).toBe((180 + 120) * MIN);
        expect(fakes.createCalls[0].line_items[0].price_data.unit_amount).toBe(35000);
    });

    it("refuses quantities past the limits and repeated add-ons", async () => {
        expect((await checkout({ addOns: [{ id: "vr", qty: 2 }] })).status).toBe(400);
        expect((await checkout({ addOns: [{ id: "laser-tag-addon", qty: 61 }] })).status).toBe(400);
        expect((await checkout({ addOns: [{ id: "extra-hour", qty: 0 }] })).status).toBe(400);
        expect((await checkout({ addOns: [{ id: "vr", qty: 1 }, { id: "vr", qty: 1 }] })).status).toBe(400);
        expect(bookings()).toHaveLength(0);
    });

    it("uses the live price list saved on /admin", async () => {
        const catalog = structuredClone(DEFAULT_CATALOG);
        Object.assign(catalog.packages.find((p) => p.id === "gaming-2hr"), { price: 600, deposit: 300 });
        catalog.addOnGroups[0].items.find((a) => a.id === "vr").price = 95;
        saveCatalog(catalog);
        await checkout({ addOns: [{ id: "vr", qty: 1, price: 80 }], price: 550 });
        const [booking] = bookings();
        expect(booking.total_cents).toBe(69500);
        expect(booking.deposit_cents).toBe(30000);
        expect(fakes.createCalls[0].line_items[0].price_data.unit_amount).toBe(30000);
    });

    it("records what Stripe says was paid, not anything from the browser", async () => {
        const { booking, sessionId } = await startCheckout();
        paySession(sessionId, { amount_total: 27500 });
        const res = await call(`/api/booking/status?session_id=${sessionId}&paid_cents=1`);
        expect(res.status).toBe(200);
        expect(res.body.booking).toMatchObject({ status: "confirmed", paid_cents: 27500, total_cents: 55000, date: FRIDAY, time: "14:00" });
        expect(bookingById(booking.id).paid_cents).toBe(27500);
    });
});

describe("Stripe webhook", () => {
    it("confirms the booking on checkout.session.completed and emails once", async () => {
        const { booking, sessionId } = await startCheckout();
        const session = paySession(sessionId);
        const res = await signedWebhook(sessionEvent("checkout.session.completed", session));
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ received: true });

        const row = bookingById(booking.id);
        expect(row.status).toBe("confirmed");
        expect(row.paid_cents).toBe(27500);
        expect(row.stripe_payment_intent).toBe(`pi_for_${sessionId}`);
        expect(row.hold_expires_at).toBeNull();
        expect(row.confirmation_sent_at).toBe(Date.now());

        const emails = confirmationEmails();
        expect(emails).toHaveLength(2);
        expect(emails.map((e) => e.to)).toEqual(expect.arrayContaining(["pat@example.com", ["tbnd@prestigiousgamingonwheelsplus.com"]]));

        // Stripe retries and repeats deliveries: nothing changes and nothing is sent again.
        vi.setSystemTime(Date.now() + MIN);
        expect((await signedWebhook(sessionEvent("checkout.session.completed", session))).status).toBe(200);
        expect((await call(`/api/booking/status?session_id=${sessionId}`)).status).toBe(200);
        expect(confirmationEmails()).toHaveLength(2);
        expect(bookingById(booking.id).confirmation_sent_at).toBe(row.confirmation_sent_at);
    });

    it("sends the confirmation once when the webhook and the confirmation page race", async () => {
        const { booking, sessionId } = await startCheckout();
        const session = paySession(sessionId);
        const results = await Promise.all([
            signedWebhook(sessionEvent("checkout.session.completed", session)),
            call(`/api/booking/status?session_id=${sessionId}`),
            signedWebhook(sessionEvent("checkout.session.completed", session)),
            call(`/api/booking/status?session_id=${sessionId}`),
        ]);
        expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200]);
        expect(bookingById(booking.id).status).toBe("confirmed");
        expect(confirmationEmails()).toHaveLength(2);
        expect(confirmationEmails().filter((e) => e.to === "pat@example.com")).toHaveLength(1);
    });

    it("sends the team's copy to everyone on the team with an email", async () => {
        sqlite.exec(`INSERT INTO staff (id, created_at, name, email, role, calendar_token) VALUES
            ('s1', 0, 'Tricia', 'tricia@example.com', 'manager', 'a'),
            ('s2', 0, 'Worker', 'worker@example.com', 'worker', 'b'),
            ('s3', 0, 'No Email', '', 'worker', 'c')`);
        const { sessionId } = await startCheckout();
        await signedWebhook(sessionEvent("checkout.session.completed", paySession(sessionId)));
        const team = confirmationEmails().find((e) => e.subject.startsWith("New booking:"));
        expect(team.to).toEqual(["tbnd@prestigiousgamingonwheelsplus.com", "tricia@example.com", "worker@example.com"]);
        expect(team.replyTo).toBe("pat@example.com");
    });

    it("tries the emails again on the next delivery when Resend failed", async () => {
        const { booking, sessionId } = await startCheckout();
        const session = paySession(sessionId);
        fakes.emailError = { message: "Resend is down" };
        expect((await signedWebhook(sessionEvent("checkout.session.completed", session))).status).toBe(200);
        expect(bookingById(booking.id).status).toBe("confirmed");
        expect(bookingById(booking.id).confirmation_sent_at).toBeNull();

        fakes.emailError = null;
        await signedWebhook(sessionEvent("checkout.session.completed", session));
        expect(confirmationEmails()).toHaveLength(2);
        expect(bookingById(booking.id).confirmation_sent_at).not.toBeNull();
    });

    it("waits for async_payment_succeeded when the payment hasn't cleared yet", async () => {
        const { booking, sessionId } = await startCheckout();
        const unpaid = { ...fakes.sessions.get(sessionId), status: "complete", payment_status: "unpaid" };
        await signedWebhook(sessionEvent("checkout.session.completed", unpaid));
        expect(bookingById(booking.id).status).toBe("pending");
        expect(confirmationEmails()).toHaveLength(0);

        const paid = paySession(sessionId);
        expect((await signedWebhook(sessionEvent("checkout.session.async_payment_succeeded", paid))).status).toBe(200);
        expect(bookingById(booking.id).status).toBe("confirmed");
        expect(confirmationEmails()).toHaveLength(2);
        await signedWebhook(sessionEvent("checkout.session.async_payment_succeeded", paid));
        expect(confirmationEmails()).toHaveLength(2);
    });

    it("expires a pending booking on checkout.session.expired and frees the slot", async () => {
        const { booking, sessionId } = await startCheckout();
        const session = { ...fakes.sessions.get(sessionId), status: "expired" };
        expect((await signedWebhook(sessionEvent("checkout.session.expired", session))).status).toBe(200);
        expect(bookingById(booking.id).status).toBe("expired");
        expect((await availability("2026-11")).days[FRIDAY]).toContain("14:00");
        expect(fakes.emails).toHaveLength(0);
    });

    it("never expires a booking that was already confirmed", async () => {
        const { booking, sessionId } = await startCheckout();
        await signedWebhook(sessionEvent("checkout.session.completed", paySession(sessionId)));
        await signedWebhook(sessionEvent("checkout.session.expired", { ...fakes.sessions.get(sessionId), status: "expired" }));
        expect(bookingById(booking.id).status).toBe("confirmed");
    });

    it("confirms a payment that arrives after the hold ran out and warns the team if the slot was taken", async () => {
        const start = Date.now();
        const { booking, sessionId } = await startCheckout({ name: "Late Payer" });
        vi.setSystemTime(start + 40 * MIN);
        expect((await checkout({ email: "second@example.com" })).status).toBe(200);
        expect(bookingById(booking.id).status).toBe("expired");

        await signedWebhook(sessionEvent("checkout.session.completed", paySession(sessionId)));
        expect(bookingById(booking.id).status).toBe("confirmed");
        const alert = fakes.emails.find((e) => e.subject === "Double booking: please check /admin");
        expect(alert).toBeDefined();
        expect(alert.html).toContain("Late Payer");
        expect(confirmationEmails()).toHaveLength(2);
    });

    it.each([
        ["signed with the wrong secret", { secret: "whsec_wrong" }],
        ["changed after signing", { tamper: (p) => p.replace('"paid"', '"paid" ') }],
    ])("rejects an event %s", async (_, options) => {
        const { booking, sessionId } = await startCheckout();
        const res = await signedWebhook(sessionEvent("checkout.session.completed", paySession(sessionId)), options);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Bad signature");
        expect(bookingById(booking.id).status).toBe("pending");
        expect(fakes.emails).toHaveLength(0);
    });

    it("rejects an event without a signature or with a stale one", async () => {
        const { booking, sessionId } = await startCheckout();
        const event = sessionEvent("checkout.session.completed", paySession(sessionId));
        const unsigned = await call("/api/stripe/webhook", { method: "POST", body: JSON.stringify(event) });
        expect(unsigned.status).toBe(400);

        // Signed 10 minutes ago: outside Stripe's 5-minute tolerance.
        const Stripe = (await vi.importActual("stripe")).default;
        const payload = JSON.stringify(event);
        const old = await new Stripe("sk_test_unused").webhooks.generateTestHeaderStringAsync({
            payload,
            secret: WEBHOOK_SECRET,
            timestamp: Math.floor(Date.now() / 1000) - 600,
        });
        const stale = await call("/api/stripe/webhook", { method: "POST", body: payload, headers: { "Stripe-Signature": old } });
        expect(stale.status).toBe(400);
        expect(bookingById(booking.id).status).toBe("pending");
    });

    it("refuses webhooks when the signing secret isn't set", async () => {
        const res = await call("/api/stripe/webhook", { method: "POST", body: "{}", env: baseEnv({ STRIPE_WEBHOOK_SECRET: undefined }) });
        expect(res.status).toBe(500);
    });

    it("ignores other event types", async () => {
        const { booking, sessionId } = await startCheckout();
        const res = await signedWebhook(sessionEvent("checkout.session.async_payment_failed", fakes.sessions.get(sessionId)));
        expect(res.status).toBe(200);
        expect(bookingById(booking.id).status).toBe("pending");
    });
});

describe("without a D1 binding", () => {
    const noDb = () => baseEnv({ DB: undefined });

    it.each([
        ["GET", "/api/booking/availability?package=gaming-2hr&month=2026-11"],
        ["POST", "/api/booking/checkout"],
        ["GET", "/api/booking/status?session_id=cs_test_1"],
        ["POST", "/api/booking/release"],
        ["GET", "/api/booking/calendar.ics?token=x"],
        ["GET", "/api/booking/catalog"],
        ["POST", "/api/booking/send-reminders"],
        ["POST", "/api/stripe/webhook"],
        ["POST", "/api/admin/login"],
        ["GET", "/api/admin/bookings"],
    ])("%s %s returns 503", async (method, path) => {
        const res = await call(path, { method, body: method === "POST" ? {} : undefined, env: noDb() });
        expect(res.status).toBe(503);
        expect(res.body.message).toMatch(/call us/);
    });

    it("still sends the contact form and 404s unknown routes", async () => {
        const contact = await call("/api/send-email", {
            method: "POST",
            body: { from_name: "Pat", user_email: "pat@example.com", message: "Hi", turnstile_token: "pass" },
            env: noDb(),
        });
        expect(contact.status).toBe(204);
        expect((await call("/api/nothing-here", { env: noDb() })).status).toBe(404);
    });
});

describe("the Stripe client", () => {
    it("isn't created by routes that don't take payments", async () => {
        const noKey = baseEnv({ STRIPE_SECRET_KEY: undefined });
        expect((await call("/api/booking/availability?package=gaming-2hr&month=2026-11", { env: noKey })).status).toBe(200);
        expect((await call("/api/booking/catalog", { env: noKey })).status).toBe(200);
        expect(
            (
                await call("/api/send-email", {
                    method: "POST",
                    body: { from_name: "Pat", user_email: "pat@example.com", message: "Hi", turnstile_token: "pass" },
                    env: noKey,
                })
            ).status
        ).toBe(204);
        expect(
            (await call("/api/admin/login", { method: "POST", body: { password: "test-password", turnstile_token: "pass" }, env: noKey }))
                .status
        ).toBe(200);
        expect((await call("/api/booking/send-reminders", { method: "POST", env: noKey })).status).toBe(200);
        expect(fakes.stripeKeys).toEqual([]);
    });

    it("is created inside checkout with the secret key, and a missing key frees the hold", async () => {
        await startCheckout();
        expect(fakes.stripeKeys).toEqual(["sk_test_fake"]);

        const noKey = baseEnv({ STRIPE_SECRET_KEY: undefined });
        const res = await checkout({ date: SATURDAY, email: "second@example.com" }, { env: noKey });
        expect(res.status).toBe(502);
        const failed = bookings().find((b) => b.customer_email === "second@example.com");
        expect(failed.status).toBe("expired");
        expect((await availability("2026-11")).days[SATURDAY]).toContain("14:00");
    });

    it("uses the test key in development", async () => {
        const dev = baseEnv({ NODE_ENV: "development", STRIPE_SECRET_TEST_KEY: "sk_test_dev" });
        await checkout({}, { env: dev });
        expect(fakes.stripeKeys).toEqual(["sk_test_dev"]);
    });
});

describe("reminders", () => {
    const sendReminders = () => call("/api/booking/send-reminders", { method: "POST" });

    it("emails a confirmed booking for tomorrow, once", async () => {
        const booking = insertBooking({ date: "2026-11-06", time: "18:00" });
        expect((await sendReminders()).body).toEqual({ sent: 1 });
        expect(reminderEmails()).toHaveLength(1);
        expect(reminderEmails()[0].to).toBe("guest@example.com");
        expect(bookingById(booking.id).reminder_sent_at).toBe(Date.now());

        vi.setSystemTime(Date.now() + 3 * HOUR);
        expect((await sendReminders()).body).toEqual({ sent: 0 });
        expect(reminderEmails()).toHaveLength(1);
    });

    it("sends once when two runs overlap", async () => {
        insertBooking({ date: "2026-11-06", time: "18:00" });
        const results = await Promise.all([sendReminders(), sendReminders(), sendReminders()]);
        expect(results.reduce((n, r) => n + r.body.sent, 0)).toBe(1);
        expect(reminderEmails()).toHaveLength(1);
    });

    it("skips bookings that aren't confirmed, have no email, aren't tomorrow or were booked in the last 12 hours", async () => {
        insertBooking({ date: "2026-11-06", time: "12:00", status: "pending", hold_expires_at: Date.now() + HOUR });
        insertBooking({ date: "2026-11-06", time: "13:00", status: "cancelled" });
        insertBooking({ date: "2026-11-06", time: "14:00", status: "expired" });
        insertBooking({ date: "2026-11-06", time: "15:00", customer_email: "" });
        insertBooking({ date: "2026-11-06", time: "16:00", created_at: Date.now() - 11 * HOUR });
        insertBooking({ date: "2026-11-06", time: "17:00", reminder_sent_at: Date.now() - HOUR });
        insertBooking({ date: "2026-11-05", time: "18:00" });
        insertBooking({ date: "2026-11-07", time: "00:00" });
        expect((await sendReminders()).body).toEqual({ sent: 0 });
        expect(reminderEmails()).toHaveLength(0);
    });

    it("tries again on the next run when the email fails", async () => {
        const booking = insertBooking({ date: "2026-11-06", time: "18:00" });
        fakes.emailError = { message: "Resend is down" };
        expect((await sendReminders()).body).toEqual({ sent: 0 });
        expect(bookingById(booking.id).reminder_sent_at).toBeNull();
        fakes.emailError = null;
        expect((await sendReminders()).body).toEqual({ sent: 1 });
    });

    // Each case: the instant the run happens, whether it's inside 8 AM to 9 PM New York time, and the party date.
    it.each([
        ["7:59 AM EST", "2026-11-05T12:59:00Z", false, "2026-11-06"],
        ["8:00 AM EST", "2026-11-05T13:00:00Z", true, "2026-11-06"],
        ["8:59 PM EST", "2026-11-06T01:59:00Z", true, "2026-11-06"],
        ["9:00 PM EST", "2026-11-06T02:00:00Z", false, "2026-11-06"],
        // Spring forward, Sunday 8 March 2026: 8 AM is 13:00 UTC before and 12:00 UTC after.
        ["7:59 AM EST on the Saturday before spring forward", "2026-03-07T12:59:00Z", false, "2026-03-08"],
        ["8:00 AM EST on the Saturday before spring forward", "2026-03-07T13:00:00Z", true, "2026-03-08"],
        ["8:00 AM EDT on the spring-forward Sunday", "2026-03-08T12:00:00Z", true, "2026-03-09"],
        ["7:59 AM EDT on the spring-forward Sunday", "2026-03-08T11:59:00Z", false, "2026-03-09"],
        ["8:59 PM EDT on the spring-forward Sunday", "2026-03-09T00:59:00Z", true, "2026-03-09"],
        ["9:00 PM EDT on the spring-forward Sunday", "2026-03-09T01:00:00Z", false, "2026-03-09"],
        // Fall back, Sunday 1 November 2026: 8 AM is 12:00 UTC before and 13:00 UTC after.
        ["8:00 AM EDT on the Saturday before fall back", "2026-10-31T12:00:00Z", true, "2026-11-01"],
        ["8:59 PM EDT on the Saturday before fall back", "2026-11-01T00:59:00Z", true, "2026-11-01"],
        ["9:00 PM EDT on the Saturday before fall back", "2026-11-01T01:00:00Z", false, "2026-11-01"],
        ["7:00 AM EST on the fall-back Sunday", "2026-11-01T12:00:00Z", false, "2026-11-02"],
        ["8:00 AM EST on the fall-back Sunday", "2026-11-01T13:00:00Z", true, "2026-11-02"],
        ["8:59 PM EST on the fall-back Sunday", "2026-11-02T01:59:00Z", true, "2026-11-02"],
        ["9:00 PM EST on the fall-back Sunday", "2026-11-02T02:00:00Z", false, "2026-11-02"],
    ])("at %s sends: %s", async (_, at, sends, partyDate) => {
        vi.setSystemTime(new Date(at));
        insertBooking({ date: partyDate, time: "15:00" });
        const res = await sendReminders();
        expect(res.status).toBe(200);
        expect(res.body.sent).toBe(sends ? 1 : 0);
        if (!sends) expect(res.body.skipped).toBe("outside 8 AM to 9 PM");
        expect(reminderEmails()).toHaveLength(sends ? 1 : 0);
    });

    it("covers the whole 25-hour fall-back day as tomorrow, and nothing after it", async () => {
        vi.setSystemTime(new Date("2026-10-31T14:00:00Z"));
        const early = insertBooking({ date: "2026-11-01", time: "00:30", customer_email: "early@example.com" });
        // 1:30 AM happens twice on 1 November. The worker uses the first one (EDT).
        const repeated = insertBooking({ date: "2026-11-01", time: "01:30", customer_email: "repeat@example.com" });
        const late = insertBooking({ date: "2026-11-01", time: "23:30", customer_email: "late@example.com" });
        insertBooking({ date: "2026-11-02", time: "00:00", customer_email: "monday@example.com" });
        insertBooking({ date: "2026-10-31", time: "23:30", customer_email: "tonight@example.com" });
        expect(new Date(late.starts_at).toISOString()).toBe("2026-11-02T04:30:00.000Z");
        expect(new Date(repeated.starts_at).toISOString()).toBe("2026-11-01T05:30:00.000Z");
        // After the change, 4 AM is EST.
        const after = insertBooking({ date: "2026-11-01", time: "04:00", customer_email: "after@example.com" });
        expect(new Date(after.starts_at).toISOString()).toBe("2026-11-01T09:00:00.000Z");
        expect((await sendReminders()).body).toEqual({ sent: 4 });
        expect(reminderEmails().map((e) => e.to).sort()).toEqual([
            "after@example.com",
            "early@example.com",
            "late@example.com",
            "repeat@example.com",
        ]);
        expect(early.starts_at).toBe(Date.parse("2026-11-01T04:30:00Z"));
    });

    it("covers the whole 23-hour spring-forward day as tomorrow, and nothing after it", async () => {
        vi.setSystemTime(new Date("2026-03-07T15:00:00Z"));
        insertBooking({ date: "2026-03-08", time: "00:30", customer_email: "early@example.com" });
        // 2:30 AM doesn't exist on 8 March: it moves an hour later, as clocks do.
        const skipped = insertBooking({ date: "2026-03-08", time: "02:30", customer_email: "skipped@example.com" });
        insertBooking({ date: "2026-03-08", time: "23:30", customer_email: "late@example.com" });
        insertBooking({ date: "2026-03-09", time: "00:00", customer_email: "monday@example.com" });
        expect(new Date(skipped.starts_at).toISOString()).toBe("2026-03-08T07:30:00.000Z");
        // After the change, 3:30 AM is EDT.
        const after = insertBooking({ date: "2026-03-08", time: "03:30", customer_email: "after@example.com" });
        expect(new Date(after.starts_at).toISOString()).toBe("2026-03-08T07:30:00.000Z");
        expect((await sendReminders()).body).toEqual({ sent: 4 });
        expect(reminderEmails().map((e) => e.to).sort()).toEqual([
            "after@example.com",
            "early@example.com",
            "late@example.com",
            "skipped@example.com",
        ]);
    });

    it("logs instead of emailing in development", async () => {
        insertBooking({ date: "2026-11-06", time: "18:00" });
        const res = await call("/api/booking/send-reminders", { method: "POST", env: baseEnv({ NODE_ENV: "development" }) });
        expect(res.body).toEqual({ sent: 1 });
        expect(fakes.emails).toHaveLength(0);
    });
});

describe("escaping in email HTML", () => {
    const nasty = {
        name: `<b>Bob</b> "O'Neil" & co`,
        address: `<img src=x onerror=alert(1)> 12 Main St, Queens`,
        notes: `<a href="https://evil.example">click</a>\n<script>alert(1)</script>`,
        phone: `718<i>555</i>0100`,
    };
    const raw = ["<b>Bob", "<img src=x", '<a href="https://evil.example"', "<script>", "<i>555"];

    function expectEscaped(html) {
        for (const snippet of raw) expect(html).not.toContain(snippet);
    }

    it("escapes the contact form", async () => {
        const res = await call("/api/send-email", {
            method: "POST",
            body: { from_name: nasty.name, user_email: "pat@example.com", message: nasty.notes, turnstile_token: "pass" },
        });
        expect(res.status).toBe(204);
        const [email] = fakes.emails;
        expectEscaped(email.html);
        expect(email.html).toContain("&lt;b&gt;Bob&lt;/b&gt; &quot;O&#39;Neil&quot; &amp; co");
        expect(email.html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;click&lt;/a&gt;<br />&lt;script&gt;");
    });

    it("refuses the contact form without a passing spam check", async () => {
        const res = await call("/api/send-email", {
            method: "POST",
            body: { from_name: "Pat", user_email: "pat@example.com", message: "Hi", turnstile_token: "bot" },
        });
        expect(res.status).toBe(403);
        expect(fakes.emails).toHaveLength(0);
    });

    it("escapes booking details in both confirmation emails", async () => {
        const { sessionId } = await startCheckout(nasty);
        await signedWebhook(sessionEvent("checkout.session.completed", paySession(sessionId)));
        const emails = confirmationEmails();
        expect(emails).toHaveLength(2);
        for (const email of emails) {
            expectEscaped(email.html);
            expect(email.html).toContain("&lt;img src=x onerror=alert(1)&gt; 12 Main St, Queens");
            expect(email.html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;click&lt;/a&gt;<br />&lt;script&gt;");
        }
        const team = emails.find((e) => e.subject.startsWith("New booking:"));
        expect(team.html).toContain("&lt;b&gt;Bob&lt;/b&gt; &quot;O&#39;Neil&quot; &amp; co");
        expect(team.html).toContain("718&lt;i&gt;555&lt;/i&gt;0100");
    });

    it("escapes package and add-on names from the saved price list", async () => {
        const catalog = structuredClone(DEFAULT_CATALOG);
        catalog.packages.find((p) => p.id === "gaming-2hr").name = "Party <script>x</script>";
        catalog.addOnGroups[0].items.find((a) => a.id === "vr").name = "VR <img src=y>";
        saveCatalog(catalog);
        const { sessionId } = await startCheckout({ addOns: [{ id: "vr", qty: 1 }] });
        await signedWebhook(sessionEvent("checkout.session.completed", paySession(sessionId)));
        for (const email of confirmationEmails()) {
            expect(email.html).not.toContain("<script>x");
            expect(email.html).not.toContain("<img src=y");
            expect(email.html).toContain("Party &lt;script&gt;x&lt;/script&gt;");
            expect(email.html).toContain("VR &lt;img src=y&gt;");
        }
    });

    it("escapes the reminder and the double-booking alert", async () => {
        insertBooking({ date: "2026-11-06", time: "18:00", customer_name: nasty.name, address: nasty.address, notes: nasty.notes });
        await call("/api/booking/send-reminders", { method: "POST" });
        const [reminder] = reminderEmails();
        expectEscaped(reminder.html);
        expect(reminder.html).toContain("Hi &lt;b&gt;Bob&lt;/b&gt;,");

        const start = Date.now();
        const { sessionId } = await startCheckout(nasty);
        vi.setSystemTime(start + 40 * MIN);
        await checkout({ email: "second@example.com" });
        await signedWebhook(sessionEvent("checkout.session.completed", paySession(sessionId)));
        const alert = fakes.emails.find((e) => e.subject.startsWith("Double booking"));
        expectEscaped(alert.html);
        expect(alert.html).toContain("&lt;b&gt;Bob&lt;/b&gt;");
    });
});

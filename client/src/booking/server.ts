// Booking API, run by the Cloudflare worker (public/_worker.js). Replaces 10to8:
//   /api/booking/*      the public booking page: open times, deposit checkout, confirmation
//   /api/stripe-webhook Stripe telling us a deposit went through
//   /api/admin/*        the /admin page: approve, decline, cancel, add and edit bookings, time off, hours
//   /api/calendar.ics   a private calendar feed of every party, for Google or Apple Calendar
// Talks to the D1 database, Stripe and Resend through small interfaces so the tests can swap in fakes.
import { Resend } from "resend";
import Stripe from "stripe";
import { CANCELLATION_POLICY, PARTY_PACKAGES } from "../data/packages";
import { d1Store, type D1Database } from "./d1";
import { BOOKABLE_ADD_ONS, findPackage, quote, QuoteError, type Quote } from "./quote";
import { BookingSettings, Busy, busyFor, fits, normalizeSettings, startTimes } from "./schedule";
import { addDays, formatDate, formatRange, formatTime, isDate, isTime, todayInZone, utcToZoned, zonedToUtc } from "./time";

export interface Env {
    // The D1 database binding (Pages > Settings > Bindings).
    DB?: D1Database;
    STRIPE_SECRET_KEY?: string;
    STRIPE_SECRET_TEST_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    RESEND_KEY?: string;
    TURNSTILE_SECRET?: string;
    NODE_ENV?: string;
    // Password for the /admin page. Sign-in is off until it's set.
    ADMIN_PASSWORD?: string;
    // Where new-booking alerts go. Defaults to the business email.
    NOTIFY_EMAIL?: string;
    // Secret in the calendar feed link. The feed is off until this is set.
    CALENDAR_TOKEN?: string;
}

export type Status = "hold" | "requested" | "confirmed" | "declined" | "cancelled";

export interface BookingRow {
    id: string;
    created_at: string;
    status: Status;
    source: "online" | "admin";
    package_id: string;
    add_ons: string[];
    extra_hours: number;
    guests: number;
    start_at: string;
    end_at: string;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    address: string | null;
    guest_of_honor: string | null;
    notes: string | null;
    admin_notes: string | null;
    total: number;
    deposit: number;
    paid: number;
    refunded: number;
    stripe_session_id: string | null;
    stripe_payment_intent: string | null;
    hold_expires_at: string | null;
}

export interface BlockRow {
    id: string;
    created_at: string;
    start_at: string;
    end_at: string;
    reason: string | null;
}

export type NewBooking = Omit<BookingRow, "id" | "created_at">;

export interface Store {
    bookingsBetween(from: number, to: number): Promise<BookingRow[]>;
    blocksBetween(from: number, to: number): Promise<BlockRow[]>;
    getBooking(id: string): Promise<BookingRow | null>;
    insertBooking(row: NewBooking): Promise<BookingRow>;
    // Only updates when the booking is in one of `fromStatuses`, so two requests can't both act on it.
    updateBooking(id: string, patch: Partial<NewBooking>, fromStatuses?: Status[]): Promise<BookingRow | null>;
    insertBlock(row: Omit<BlockRow, "id" | "created_at">): Promise<BlockRow>;
    deleteBlock(id: string): Promise<void>;
    getSettings(): Promise<Partial<BookingSettings> | null>;
    saveSettings(settings: BookingSettings): Promise<void>;
}

export interface CheckoutSession {
    id: string;
    url: string | null;
    payment_status: string;
    amount_total: number | null;
    payment_intent: string | null;
    metadata: Record<string, string> | null;
}

export interface Payments {
    createCheckout(params: {
        bookingId: string;
        email: string;
        amountCents: number;
        name: string;
        description: string;
        successUrl: string;
        cancelUrl: string;
        expiresAt: number;
    }): Promise<CheckoutSession>;
    getCheckout(id: string): Promise<CheckoutSession>;
    refund(paymentIntent: string, amountCents: number): Promise<void>;
    // Checks the Stripe signature and returns the event, or throws.
    webhookEvent(body: string, signature: string): Promise<{ type: string; data: { object: { id: string } } }>;
}

export interface Email {
    to: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: string }[];
}

export interface Deps {
    store: Store;
    payments: Payments;
    sendEmail(email: Email): Promise<void>;
    verifyHuman(token: string, ip: string | null): Promise<boolean>;
    now(): number;
    env: Env;
}

const BUSINESS_EMAIL = "tbnd@prestigiousgamingonwheelsplus.com";
const SITE_URL = "https://prestigiousgamingonwheelsplus.com";
const ALLOWED_ORIGINS = [
    SITE_URL,
    "https://www.prestigiousgamingonwheelsplus.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];
// Stripe's checkout page must stay open at least 30 minutes. The slot is held a little longer than that,
// so nobody else can take it while the customer is still paying.
const CHECKOUT_MINUTES = 31;
const HOLD_MINUTES = 40;
const DAY = 86_400_000;
const EMAIL_PATTERN = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;
const ACTIVE: Status[] = ["hold", "requested", "confirmed"];
const SESSION_DAYS = 30;
const MIN_PASSWORD_LENGTH = 10;

class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
        public extra: Record<string, unknown> = {}
    ) {
        super(message);
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Routing

export function isBookingPath(pathname: string) {
    return (
        pathname.startsWith("/api/booking/") ||
        pathname.startsWith("/api/admin/") ||
        pathname === "/api/stripe-webhook" ||
        pathname === "/api/calendar.ics"
    );
}

export async function handleBookingApi(request: Request, env: Env, deps: Deps = liveDeps(env)): Promise<Response> {
    const url = new URL(request.url);
    const cors = corsHeaders(request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
        const res = await route(request, url, deps);
        for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
        return res;
    } catch (error) {
        if (error instanceof HttpError) return json({ message: error.message, ...error.extra }, error.status, cors);
        if (error instanceof QuoteError) return json({ message: error.message }, 400, cors);
        console.error("Booking API error:", error);
        return json({ message: "Something went wrong on our end. Please try again or give us a call." }, 500, cors);
    }
}

async function route(request: Request, url: URL, deps: Deps): Promise<Response> {
    const { pathname } = url;
    const method = request.method;

    if (pathname === "/api/booking/availability" && method === "GET") return availability(url, deps);
    if (pathname === "/api/booking/checkout" && method === "POST") return checkout(request, deps);
    if (pathname === "/api/booking/confirm" && method === "GET") return confirmPayment(url, deps);
    if (pathname === "/api/stripe-webhook" && method === "POST") return stripeWebhook(request, deps);
    if (pathname === "/api/calendar.ics" && method === "GET") return calendarFeed(url, deps);
    if (pathname === "/api/admin/login" && method === "POST") return adminLogin(request, deps);

    if (pathname.startsWith("/api/admin/")) {
        await requireAdmin(request, deps);
        const [, , , resource, id] = pathname.split("/");
        if (resource === "bookings" && !id && method === "GET") return adminList(url, deps);
        if (resource === "bookings" && !id && method === "POST") return adminCreate(request, deps);
        if (resource === "bookings" && id && method === "PATCH") return adminUpdate(id, request, deps);
        if (resource === "blocks" && !id && method === "POST") return adminAddBlock(request, deps);
        if (resource === "blocks" && id && method === "DELETE") return adminDeleteBlock(id, deps);
        if (resource === "settings" && method === "GET") return adminGetSettings(deps);
        if (resource === "settings" && method === "PUT") return adminSaveSettings(request, deps);
    }
    throw new HttpError(404, "Not found");
}

function corsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get("Origin");
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE",
        Vary: "Origin",
    };
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
    });
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Invalid request.");
    return body as Record<string, unknown>;
}

const text = (body: Record<string, unknown>, key: string, max: number) =>
    typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";
const int = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isInteger(v) ? v : fallback);
const stringList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

// ---------------------------------------------------------------------------------------------------------------
// Availability

async function loadSettings(deps: Deps) {
    return normalizeSettings(await deps.store.getSettings());
}

// Everything that takes up calendar time between two instants: live bookings (with the gap after them) and time off.
async function busyBetween(deps: Deps, settings: BookingSettings, from: number, to: number, ignoreId?: string) {
    const now = deps.now();
    const [bookings, blocks] = await Promise.all([
        deps.store.bookingsBetween(from - DAY, to + DAY),
        deps.store.blocksBetween(from - DAY, to + DAY),
    ]);
    const busy: Busy[] = [];
    for (const b of bookings) {
        if (b.id === ignoreId || !ACTIVE.includes(b.status)) continue;
        if (b.status === "hold" && (!b.hold_expires_at || Date.parse(b.hold_expires_at) <= now)) continue;
        busy.push(busyFor(Date.parse(b.start_at), Date.parse(b.end_at), settings.bufferMinutes));
    }
    for (const b of blocks) busy.push({ start: Date.parse(b.start_at), end: Date.parse(b.end_at), all: true });
    return busy;
}

async function availability(url: URL, deps: Deps) {
    const pkg = findPackage(url.searchParams.get("package") ?? "");
    if (!pkg) throw new HttpError(400, "Please pick a party package.");
    const extraHours = Math.min(3, Math.max(0, Number(url.searchParams.get("extraHours")) || 0));
    const month = url.searchParams.get("month") ?? "";
    if (!/^\d{4}-\d{2}$/.test(month) || !isDate(`${month}-01`)) throw new HttpError(400, "Invalid month.");

    const settings = await loadSettings(deps);
    const today = todayInZone(deps.now());
    const first = `${month}-01`;
    const last = addDays(addDays(first, 32).slice(0, 8) + "01", -1);
    const days: Record<string, string[]> = {};
    if (last >= today) {
        const start = first < today ? today : first;
        const busy = await busyBetween(deps, settings, zonedToUtc(start, "00:00"), zonedToUtc(addDays(last, 1), "00:00"));
        for (let d = start; d <= last; d = addDays(d, 1)) {
            const times = startTimes(d, pkg.minutes + extraHours * 60, settings, busy, deps.now());
            if (times.length) days[d] = times;
        }
    }
    return json({ month, days, lastBookableDate: addDays(today, settings.maxAdvanceDays) });
}

// ---------------------------------------------------------------------------------------------------------------
// Customer checkout

interface PartyDetails {
    quote: Quote;
    addOns: string[];
    extraHours: number;
    guests: number;
    date: string;
    time: string;
    start: number;
    end: number;
}

function readParty(body: Record<string, unknown>): PartyDetails {
    const addOns = [...new Set(stringList(body.addOns))];
    const extraHours = int(body.extraHours);
    const guests = int(body.guests);
    const q = quote({ packageId: text(body, "packageId", 50), addOns, extraHours, guests });
    const date = body.date;
    const time = body.time;
    if (!isDate(date) || !isTime(time)) throw new HttpError(400, "Please pick a date and time.");
    const start = zonedToUtc(date, time);
    return { quote: q, addOns, extraHours, guests, date, time, start, end: start + q.minutes * 60_000 };
}

function readContact(body: Record<string, unknown>, required: boolean) {
    const name = text(body, "name", 100).replace(/\s+/g, " ");
    const email = text(body, "email", 254);
    const phone = text(body, "phone", 30);
    const address = text(body, "address", 300);
    if (!name) throw new HttpError(400, "Please enter your name.");
    if ((required || email) && !EMAIL_PATTERN.test(email)) throw new HttpError(400, "Please enter a valid email address.");
    const digits = phone.replace(/\D/g, "");
    if ((required || phone) && (digits.length < 10 || digits.length > 15))
        throw new HttpError(400, "Please enter a valid phone number.");
    if (required && address.length < 8) throw new HttpError(400, "Please enter the full party address.");
    return {
        customer_name: name,
        customer_email: email || null,
        customer_phone: phone || null,
        address: address || null,
        guest_of_honor: text(body, "guestOfHonor", 100) || null,
        notes: text(body, "notes", 2000) || null,
    };
}

function siteOrigin(request: Request) {
    const origin = request.headers.get("Origin");
    return origin && ALLOWED_ORIGINS.includes(origin) ? origin : SITE_URL;
}

async function checkout(request: Request, deps: Deps) {
    const body = await readJson(request);
    const party = readParty(body);
    const contact = readContact(body, true);
    if (body.agree !== true) throw new HttpError(400, "Please agree to the cancellation policy.");
    const human = await deps.verifyHuman(text(body, "turnstileToken", 2048), request.headers.get("CF-Connecting-IP"));
    if (!human) throw new HttpError(403, "The spam check didn't go through. Please try again.");

    const settings = await loadSettings(deps);
    const busy = await busyBetween(deps, settings, party.start, party.end);
    if (!startTimes(party.date, party.quote.minutes, settings, busy, deps.now()).includes(party.time))
        throw new HttpError(409, "Sorry, that time was just taken. Please pick another one.", { code: "slot_taken" });

    const now = deps.now();
    const booking = await deps.store.insertBooking({
        status: "hold",
        source: "online",
        package_id: party.quote.pkg.id,
        add_ons: party.addOns,
        extra_hours: party.extraHours,
        guests: party.guests,
        start_at: new Date(party.start).toISOString(),
        end_at: new Date(party.end).toISOString(),
        ...contact,
        admin_notes: null,
        total: party.quote.total,
        deposit: party.quote.deposit,
        paid: 0,
        refunded: 0,
        stripe_session_id: null,
        stripe_payment_intent: null,
        hold_expires_at: new Date(now + HOLD_MINUTES * 60_000).toISOString(),
    });

    const origin = siteOrigin(request);
    let session: CheckoutSession;
    try {
        session = await deps.payments.createCheckout({
            bookingId: booking.id,
            email: contact.customer_email!,
            amountCents: Math.round(party.quote.deposit * 100),
            name: `Deposit: ${party.quote.pkg.name}`,
            description: `${formatRange(party.start, party.end)}. Remaining $${money(party.quote.balance)} is due at the party.`,
            successUrl: `${origin}/book/confirmed?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${origin}/book?package=${party.quote.pkg.id}&canceled=1`,
            expiresAt: Math.floor(now / 1000) + CHECKOUT_MINUTES * 60,
        });
    } catch (error) {
        await deps.store.updateBooking(booking.id, { status: "cancelled", hold_expires_at: null }, ["hold"]);
        throw error;
    }
    await deps.store.updateBooking(booking.id, { stripe_session_id: session.id });
    return json({ url: session.url });
}

// Moves a paid booking from "hold" to "requested" and sends the emails. Called both when the customer comes
// back from Stripe and from Stripe's webhook, whichever happens first. The status check makes it run once.
async function finalize(sessionId: string, deps: Deps) {
    const session = await deps.payments.getCheckout(sessionId);
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) throw new HttpError(404, "We couldn't find that booking.");
    if (session.payment_status === "paid") {
        const updated = await deps.store.updateBooking(
            bookingId,
            {
                status: "requested",
                paid: (session.amount_total ?? 0) / 100,
                stripe_payment_intent: session.payment_intent,
                hold_expires_at: null,
            },
            ["hold"]
        );
        if (updated) {
            await Promise.allSettled([
                deps.sendEmail(customerEmail(updated, "requested")),
                deps.sendEmail(ownerEmail(updated, deps.env)),
            ]);
            return updated;
        }
    }
    const booking = await deps.store.getBooking(bookingId);
    if (!booking) throw new HttpError(404, "We couldn't find that booking.");
    return booking;
}

async function confirmPayment(url: URL, deps: Deps) {
    const sessionId = url.searchParams.get("session_id") ?? "";
    if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new HttpError(400, "Invalid link.");
    const b = await finalize(sessionId, deps);
    const pkg = findPackage(b.package_id);
    return json({
        status: b.status,
        firstName: b.customer_name.split(" ")[0],
        email: b.customer_email,
        packageName: pkg?.name ?? b.package_id,
        when: formatRange(Date.parse(b.start_at), Date.parse(b.end_at)),
        paid: Number(b.paid),
        balance: Number(b.total) - Number(b.paid),
    });
}

async function stripeWebhook(request: Request, deps: Deps) {
    const signature = request.headers.get("Stripe-Signature");
    if (!signature) throw new HttpError(400, "Missing signature.");
    let event;
    try {
        event = await deps.payments.webhookEvent(await request.text(), signature);
    } catch (error) {
        console.error("Stripe webhook signature check failed:", error);
        throw new HttpError(400, "Bad signature.");
    }
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded")
        await finalize(event.data.object.id, deps);
    return json({ received: true });
}

// ---------------------------------------------------------------------------------------------------------------
// Admin

// Sign-in is one shared password (ADMIN_PASSWORD). Signing in returns a token that's good for 30 days. Tokens are
// signed with the password, so changing ADMIN_PASSWORD in Cloudflare signs out every device.
const encoder = new TextEncoder();

const toBase64Url = (bytes: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromBase64Url = (value: string) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

function sessionKey(password: string) {
    return crypto.subtle.importKey("raw", encoder.encode(`pgow-admin-session:${password}`), { name: "HMAC", hash: "SHA-256" }, false, [
        "sign",
        "verify",
    ]);
}

async function createSession(password: string, now: number) {
    const expires = now + SESSION_DAYS * DAY;
    const signature = await crypto.subtle.sign("HMAC", await sessionKey(password), encoder.encode(`admin.${expires}`));
    return { token: `${expires}.${toBase64Url(signature)}`, expires };
}

async function validSession(token: string, password: string, now: number) {
    const [expires, signature] = token.split(".");
    if (!/^\d+$/.test(expires ?? "") || Number(expires) <= now || !signature) return false;
    try {
        return await crypto.subtle.verify("HMAC", await sessionKey(password), fromBase64Url(signature), encoder.encode(`admin.${expires}`));
    } catch {
        return false;
    }
}

// Compares hashes of the two passwords, so the time taken doesn't hint at how much of a guess was right.
async function samePassword(guess: string, password: string) {
    const [a, b] = await Promise.all([guess, password].map(async (p) => new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(p)))));
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
}

function adminPassword(deps: Deps) {
    const password = deps.env.ADMIN_PASSWORD ?? "";
    return password.length >= MIN_PASSWORD_LENGTH ? password : null;
}

async function adminLogin(request: Request, deps: Deps) {
    const password = adminPassword(deps);
    if (!password)
        throw new HttpError(503, `Sign-in isn't set up yet. Add an ADMIN_PASSWORD of at least ${MIN_PASSWORD_LENGTH} characters in Cloudflare.`);
    const body = await readJson(request);
    const ip = request.headers.get("CF-Connecting-IP");
    if (!(await deps.verifyHuman(text(body, "turnstileToken", 2048), ip)))
        throw new HttpError(403, "The spam check didn't go through. Please try again.");
    if (!(await samePassword(typeof body.password === "string" ? body.password : "", password))) {
        console.warn("Admin sign-in failed from", ip);
        throw new HttpError(401, "Wrong password.");
    }
    return json(await createSession(password, deps.now()));
}

async function requireAdmin(request: Request, deps: Deps) {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const password = adminPassword(deps);
    if (!token || !password || !(await validSession(token, password, deps.now()))) throw new HttpError(401, "Please sign in.");
}

async function adminList(url: URL, deps: Deps) {
    const now = deps.now();
    const from = Date.parse(url.searchParams.get("from") ?? "") || now - 60 * DAY;
    const to = Date.parse(url.searchParams.get("to") ?? "") || now + 400 * DAY;
    const [bookings, blocks, settings] = await Promise.all([
        deps.store.bookingsBetween(from, to),
        deps.store.blocksBetween(from, to),
        loadSettings(deps),
    ]);
    return json({
        // Unpaid holds are left out: they either turn into a request or expire within the hour.
        bookings: bookings.filter((b) => b.status !== "hold"),
        blocks,
        settings,
        calendarUrl: deps.env.CALENDAR_TOKEN ? `${SITE_URL}/api/calendar.ics?token=${deps.env.CALENDAR_TOKEN}` : null,
        packages: PARTY_PACKAGES.map((p) => ({ id: p.id, name: p.name })),
        addOns: BOOKABLE_ADD_ONS.map((a) => ({ id: a.id, name: a.name })),
    });
}

// Phone bookings and bookings moved over from 10to8. Saved as confirmed; no payment is taken.
async function adminCreate(request: Request, deps: Deps) {
    const body = await readJson(request);
    const party = readParty(body);
    const contact = readContact(body, false);
    await checkConflicts(party, body.force === true, deps);
    const paid = typeof body.paid === "number" && body.paid >= 0 ? Math.round(body.paid * 100) / 100 : 0;
    const booking = await deps.store.insertBooking({
        status: "confirmed",
        source: "admin",
        package_id: party.quote.pkg.id,
        add_ons: party.addOns,
        extra_hours: party.extraHours,
        guests: party.guests,
        start_at: new Date(party.start).toISOString(),
        end_at: new Date(party.end).toISOString(),
        ...contact,
        admin_notes: text(body, "adminNotes", 2000) || null,
        total: party.quote.total,
        deposit: party.quote.deposit,
        paid,
        refunded: 0,
        stripe_session_id: null,
        stripe_payment_intent: null,
        hold_expires_at: null,
    });
    if (body.notify === true && booking.customer_email) await deps.sendEmail(customerEmail(booking, "confirmed"));
    return json({ booking }, 201);
}

async function checkConflicts(party: PartyDetails, force: boolean, deps: Deps, ignoreId?: string) {
    if (force) return;
    const settings = await loadSettings(deps);
    const busy = await busyBetween(deps, settings, party.start, party.end, ignoreId);
    const end = party.end + settings.bufferMinutes * 60_000;
    if (!fits(party.start, end, busy, settings.crews))
        throw new HttpError(409, "This overlaps other parties or time off.", { code: "conflict" });
}

async function adminUpdate(id: string, request: Request, deps: Deps) {
    const body = await readJson(request);
    const booking = await deps.store.getBooking(id);
    if (!booking) throw new HttpError(404, "Booking not found.");
    const action = body.action;
    const notify = body.notify !== false;

    if (action === "confirm") {
        const updated = await deps.store.updateBooking(id, { status: "confirmed" }, ["requested"]);
        if (!updated) throw new HttpError(409, "This booking isn't waiting for approval anymore.");
        if (notify && updated.customer_email) await deps.sendEmail(customerEmail(updated, "confirmed"));
        return json({ booking: updated });
    }

    if (action === "decline" || action === "cancel") {
        const from: Status[] = action === "decline" ? ["requested"] : ["requested", "confirmed"];
        if (!from.includes(booking.status)) throw new HttpError(409, `This booking is already ${booking.status}.`);
        // Declining always refunds the deposit. Cancelling refunds only when asked (the 48-hour policy).
        const refundable = Number(booking.paid) - Number(booking.refunded);
        const refund = action === "decline" || body.refund === true ? refundable : 0;
        if (refund > 0 && booking.stripe_payment_intent)
            await deps.payments.refund(booking.stripe_payment_intent, Math.round(refund * 100));
        const status: Status = action === "decline" ? "declined" : "cancelled";
        const updated = await deps.store.updateBooking(
            id,
            { status, refunded: Number(booking.refunded) + (booking.stripe_payment_intent ? refund : 0) },
            from
        );
        if (!updated) throw new HttpError(409, "This booking changed in the meantime. Please refresh.");
        if (notify && updated.customer_email)
            await deps.sendEmail(customerEmail(updated, status, text(body, "message", 2000)));
        return json({ booking: updated });
    }

    if (action === "update") {
        const party = readParty(body);
        const contact = readContact(body, false);
        await checkConflicts(party, body.force === true, deps, id);
        const moved = Date.parse(booking.start_at) !== party.start || Date.parse(booking.end_at) !== party.end;
        const paid = typeof body.paid === "number" && body.paid >= 0 ? Math.round(body.paid * 100) / 100 : booking.paid;
        const updated = await deps.store.updateBooking(id, {
            package_id: party.quote.pkg.id,
            add_ons: party.addOns,
            extra_hours: party.extraHours,
            guests: party.guests,
            start_at: new Date(party.start).toISOString(),
            end_at: new Date(party.end).toISOString(),
            ...contact,
            admin_notes: text(body, "adminNotes", 2000) || null,
            total: party.quote.total,
            paid,
        });
        if (!updated) throw new HttpError(404, "Booking not found.");
        if (body.notify === true && moved && updated.customer_email && ["requested", "confirmed"].includes(updated.status))
            await deps.sendEmail(customerEmail(updated, "moved"));
        return json({ booking: updated });
    }

    throw new HttpError(400, "Unknown action.");
}

async function adminAddBlock(request: Request, deps: Deps) {
    const body = await readJson(request);
    const { startDate, endDate } = body;
    const startTime = isTime(body.startTime) ? body.startTime : "00:00";
    const endTime = isTime(body.endTime) ? body.endTime : null;
    if (!isDate(startDate) || !isDate(endDate)) throw new HttpError(400, "Please pick the dates.");
    const start = zonedToUtc(startDate, startTime);
    // With no end time the block runs through the end of the last day.
    const end = endTime ? zonedToUtc(endDate, endTime) : zonedToUtc(addDays(endDate, 1), "00:00");
    if (end <= start) throw new HttpError(400, "The end has to be after the start.");
    const block = await deps.store.insertBlock({
        start_at: new Date(start).toISOString(),
        end_at: new Date(end).toISOString(),
        reason: text(body, "reason", 200) || null,
    });
    return json({ block }, 201);
}

async function adminDeleteBlock(id: string, deps: Deps) {
    await deps.store.deleteBlock(id);
    return new Response(null, { status: 204 });
}

async function adminGetSettings(deps: Deps) {
    return json({ settings: await loadSettings(deps) });
}

async function adminSaveSettings(request: Request, deps: Deps) {
    const body = await readJson(request);
    const settings = normalizeSettings(body.settings as Partial<BookingSettings>);
    await deps.store.saveSettings(settings);
    return json({ settings });
}

// ---------------------------------------------------------------------------------------------------------------
// Calendar feed (iCalendar). Subscribed to from Google Calendar or the iPhone Calendar app.

async function calendarFeed(url: URL, deps: Deps) {
    const token = deps.env.CALENDAR_TOKEN;
    if (!token || url.searchParams.get("token") !== token) throw new HttpError(404, "Not found");
    const now = deps.now();
    const [bookings, blocks] = await Promise.all([
        deps.store.bookingsBetween(now - 90 * DAY, now + 730 * DAY),
        deps.store.blocksBetween(now - 90 * DAY, now + 730 * DAY),
    ]);
    const events: string[] = [];
    for (const b of bookings) {
        if (b.status !== "requested" && b.status !== "confirmed") continue;
        const pkg = findPackage(b.package_id);
        events.push(
            icsEvent({
                uid: `${b.id}@prestigiousgamingonwheelsplus.com`,
                start: Date.parse(b.start_at),
                end: Date.parse(b.end_at),
                summary: `${b.status === "requested" ? "NEEDS APPROVAL: " : ""}${pkg?.name ?? b.package_id} – ${b.customer_name}`,
                location: b.address ?? "",
                description: bookingLines(b).join("\n"),
            })
        );
    }
    for (const b of blocks)
        events.push(
            icsEvent({
                uid: `${b.id}@prestigiousgamingonwheelsplus.com`,
                start: Date.parse(b.start_at),
                end: Date.parse(b.end_at),
                summary: `Time off${b.reason ? `: ${b.reason}` : ""}`,
            })
        );
    return new Response(icsCalendar(events, "PGOW Plus parties"), {
        headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" },
    });
}

const icsDate = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

function icsEvent(e: { uid: string; start: number; end: number; summary: string; location?: string; description?: string }) {
    return [
        "BEGIN:VEVENT",
        `UID:${e.uid}`,
        `DTSTAMP:${icsDate(Date.now())}`,
        `DTSTART:${icsDate(e.start)}`,
        `DTEND:${icsDate(e.end)}`,
        `SUMMARY:${icsText(e.summary)}`,
        e.location ? `LOCATION:${icsText(e.location)}` : "",
        e.description ? `DESCRIPTION:${icsText(e.description)}` : "",
        "END:VEVENT",
    ]
        .filter(Boolean)
        .join("\r\n");
}

function icsCalendar(events: string[], name: string) {
    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Prestigious Gaming on Wheels Plus//Bookings//EN",
        "CALSCALE:GREGORIAN",
        `X-WR-CALNAME:${name}`,
        ...events,
        "END:VCALENDAR",
        "",
    ].join("\r\n");
}

// ---------------------------------------------------------------------------------------------------------------
// Emails

const money = (n: number | string) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function addOnNames(b: BookingRow) {
    return b.add_ons.map((id) => BOOKABLE_ADD_ONS.find((a) => a.id === id)?.name ?? id);
}

function bookingLines(b: BookingRow) {
    const pkg = findPackage(b.package_id);
    const balance = Number(b.total) - Number(b.paid) + Number(b.refunded);
    return [
        `Package: ${pkg?.name ?? b.package_id}${b.extra_hours ? ` + ${b.extra_hours} extra hour${b.extra_hours === 1 ? "" : "s"}` : ""}`,
        `When: ${formatRange(Date.parse(b.start_at), Date.parse(b.end_at))}`,
        `Guests: ${b.guests}`,
        b.add_ons.length ? `Add-ons: ${addOnNames(b).join(", ")}` : "",
        b.guest_of_honor ? `Guest of honor: ${b.guest_of_honor}` : "",
        `Name: ${b.customer_name}`,
        b.customer_phone ? `Phone: ${b.customer_phone}` : "",
        b.customer_email ? `Email: ${b.customer_email}` : "",
        b.address ? `Address: ${b.address}` : "",
        `Total: $${money(b.total)} · Paid: $${money(b.paid)}${Number(b.refunded) ? ` · Refunded: $${money(b.refunded)}` : ""} · Due at party: $${money(Math.max(0, balance))}`,
        b.notes ? `Notes: ${b.notes}` : "",
    ].filter(Boolean);
}

function emailLayout(heading: string, intro: string, rows: string[], footer = "") {
    const list = rows
        .map((r) => {
            const [label, ...rest] = r.split(": ");
            return `<tr><td style="padding:6px 12px 6px 0;color:#6b6b80;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;color:#111">${escapeHtml(rest.join(": "))}</td></tr>`;
        })
        .join("");
    return `<!DOCTYPE html><html><body style="margin:0;background:#f4f4f7;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="background:#fff;border-radius:16px;padding:32px">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#e88f00;font-weight:bold">Prestigious Gaming on Wheels Plus</p>
<h1 style="margin:0 0 16px;font-size:24px;color:#111">${escapeHtml(heading)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#333">${intro}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;border-top:1px solid #eee;padding-top:8px">${list}</table>
${footer}
</div>
<p style="text-align:center;font-size:12px;color:#888;margin-top:16px">Questions? Call (718) 673-8529 or reply to this email.</p>
</div></body></html>`;
}

type CustomerEmailKind = "requested" | "confirmed" | "declined" | "cancelled" | "moved";

export function customerEmail(b: BookingRow, kind: CustomerEmailKind, message = ""): Email {
    const first = escapeHtml(b.customer_name.split(" ")[0]);
    const when = formatRange(Date.parse(b.start_at), Date.parse(b.end_at));
    const note = message ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#333">${escapeHtml(message).replace(/\n/g, "<br />")}</p>` : "";
    const policy = `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#666">${CANCELLATION_POLICY}</p>`;
    const refunded = Number(b.refunded);
    const copy: Record<CustomerEmailKind, { subject: string; heading: string; intro: string; footer: string }> = {
        requested: {
            subject: `We got your party request for ${when}`,
            heading: "Request received!",
            intro: `Thanks ${first}! Your deposit of $${money(b.paid)} went through, and your time is on hold. We'll look it over and send a confirmation shortly.`,
            footer: policy,
        },
        confirmed: {
            subject: `Your party is confirmed: ${when}`,
            heading: "You're booked!",
            intro: `Great news ${first}, your party is confirmed. Please have at least 5 car spaces free for the trailer. The calendar file attached adds it to your phone's calendar.`,
            footer: note + policy,
        },
        moved: {
            subject: `Your party time changed: ${when}`,
            heading: "Your booking was updated",
            intro: `Hi ${first}, here are the updated details for your party.`,
            footer: note,
        },
        declined: {
            subject: "About your party request",
            heading: "We can't take this booking",
            intro: `Sorry ${first}, we aren't able to take your party at this time.${refunded ? ` Your $${money(refunded)} deposit has been refunded and should show up in 5 to 10 business days.` : ""} Give us a call, and we'll help you find another date.`,
            footer: note,
        },
        cancelled: {
            subject: `Your party on ${when} is cancelled`,
            heading: "Booking cancelled",
            intro: `Hi ${first}, your party has been cancelled.${refunded ? ` $${money(refunded)} has been refunded and should show up in 5 to 10 business days.` : ""}`,
            footer: note,
        },
    };
    const c = copy[kind];
    const email: Email = {
        to: b.customer_email ?? "",
        subject: c.subject,
        html: emailLayout(c.heading, c.intro, bookingLines(b).filter((l) => !/^(Name|Phone|Email):/.test(l)), c.footer),
    };
    if (kind === "confirmed" || kind === "moved") {
        const pkg = findPackage(b.package_id);
        const ics = icsCalendar(
            [
                icsEvent({
                    uid: `${b.id}@prestigiousgamingonwheelsplus.com`,
                    start: Date.parse(b.start_at),
                    end: Date.parse(b.end_at),
                    summary: `${pkg?.name ?? "Party"} with Prestigious Gaming on Wheels Plus`,
                    location: b.address ?? "",
                    description: "Questions? Call (718) 673-8529.",
                }),
            ],
            "Party"
        );
        email.attachments = [{ filename: "party.ics", content: btoa(String.fromCharCode(...new TextEncoder().encode(ics))) }];
    }
    return email;
}

export function ownerEmail(b: BookingRow, env: Env): Email {
    const pkg = findPackage(b.package_id);
    const s = utcToZoned(Date.parse(b.start_at));
    return {
        to: env.NOTIFY_EMAIL || BUSINESS_EMAIL,
        subject: `New booking request: ${formatDate(s.date, { weekday: "short", month: "short", year: undefined })} ${formatTime(s.time)}, ${pkg?.name ?? b.package_id}`,
        html: emailLayout(
            "New booking request",
            `${escapeHtml(b.customer_name)} paid a $${money(b.paid)} deposit. Confirm or decline it on the <a href="${SITE_URL}/admin" style="color:#e88f00">bookings page</a>.`,
            bookingLines(b)
        ),
    };
}

// ---------------------------------------------------------------------------------------------------------------
// Live services

export function liveDeps(env: Env): Deps {
    let stripe: Stripe | undefined;
    const pay = () =>
        (stripe ??= new Stripe((env.NODE_ENV === "development" ? env.STRIPE_SECRET_TEST_KEY : env.STRIPE_SECRET_KEY) ?? ""));

    const toSession = (s: Stripe.Checkout.Session): CheckoutSession => ({
        id: s.id,
        url: s.url,
        payment_status: s.payment_status,
        amount_total: s.amount_total,
        payment_intent: typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null),
        metadata: s.metadata,
    });

    const payments: Payments = {
        async createCheckout(p) {
            const session = await pay().checkout.sessions.create({
                mode: "payment",
                customer_email: p.email,
                line_items: [
                    {
                        quantity: 1,
                        price_data: {
                            currency: "usd",
                            unit_amount: p.amountCents,
                            product_data: { name: p.name, description: p.description },
                        },
                    },
                ],
                metadata: { booking_id: p.bookingId },
                payment_intent_data: { metadata: { booking_id: p.bookingId }, description: `${p.name}. ${p.description}` },
                success_url: p.successUrl,
                cancel_url: p.cancelUrl,
                expires_at: p.expiresAt,
            });
            return toSession(session);
        },
        async getCheckout(id) {
            return toSession(await pay().checkout.sessions.retrieve(id));
        },
        async refund(paymentIntent, amountCents) {
            await pay().refunds.create({ payment_intent: paymentIntent, amount: amountCents });
        },
        async webhookEvent(body, signature) {
            const event = await pay().webhooks.constructEventAsync(
                body,
                signature,
                env.STRIPE_WEBHOOK_SECRET ?? "",
                undefined,
                Stripe.createSubtleCryptoProvider()
            );
            return event as unknown as { type: string; data: { object: { id: string } } };
        },
    };

    return {
        store: d1Store(env.DB),
        payments,
        async sendEmail(email) {
            if (!email.to) return;
            const { error } = await new Resend(env.RESEND_KEY).emails.send({
                from: `Prestigious Gaming on Wheels Plus <${BUSINESS_EMAIL}>`,
                replyTo: BUSINESS_EMAIL,
                to: email.to,
                subject: email.subject,
                html: email.html,
                attachments: email.attachments,
            });
            if (error) console.error("Email failed:", email.subject, error);
        },
        verifyHuman: (token, ip) => verifyTurnstile(token, ip, env),
        now: () => Date.now(),
        env,
    };
}

// Cloudflare Turnstile spam check, shared with the contact form.
export async function verifyTurnstile(token: string, ip: string | null, env: Env) {
    if (!env.TURNSTILE_SECRET) {
        console.error("TURNSTILE_SECRET is not set");
        return false;
    }
    if (!token) return false;
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);
    try {
        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
        const outcome = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
        if (!outcome.success) console.warn("Turnstile rejected:", outcome["error-codes"]);
        return outcome.success === true;
    } catch (error) {
        console.error("Turnstile verification failed:", error);
        return false;
    }
}

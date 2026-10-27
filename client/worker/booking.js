// Online booking: open time slots, Stripe Checkout for the deposit, confirmation, reminder emails, the team's calendar
// feeds and the /admin API. Pricing and slot rules come from src/lib/booking.ts, the same code the booking page runs;
// the prices themselves are the live price list managers edit on /admin (src/lib/catalog.ts).
//
// Storage is Cloudflare D1, bound to the Pages project as DB (schema in ../migrations). Times are stored as epoch
// milliseconds and sent to the browser as ISO strings.
import Stripe from "stripe";
import {
    BookingError,
    DATE_PATTERN,
    TIME_PATTERN,
    addDays,
    findPackage,
    normalizeSettings,
    openStartTimes,
    quoteBooking,
    slotFits,
    toCents,
    zonedParts,
    zonedToUtc,
} from "../src/lib/booking.ts";
import { catalogFrom, parseCatalog } from "../src/lib/catalog.ts";
import { sendBookingConfirmation, sendLoginLink, sendOwnerAlert, sendReminder } from "./emails.js";
import { ALLOWED_ORIGINS, EMAIL_PATTERN, describeWhen, dollars, jsonResponse, verifyTurnstile } from "./shared.js";

// Not imported from src/site.ts, which reads Vite-only import.meta.env.
const SITE_URL = "https://prestigiousgamingonwheelsplus.com";
// Stripe needs a Checkout Session to stay open at least 30 minutes. The hold lasts a little longer so a customer who
// pays at the last second still finds their slot.
const CHECKOUT_MINUTES = 30;
const HOLD_MINUTES = 35;
const ADMIN_SESSION_DAYS = 30;
const LOGIN_LINK_MINUTES = 20;

// Created only by the routes that need it: Stripe throws when its key isn't set, and that must never take down
// unrelated routes like the contact form.
function getStripe(env) {
    const key = env.NODE_ENV === "development" ? env.STRIPE_SECRET_TEST_KEY : env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Stripe secret key is not set");
    return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

const fail = (message, status = 400) => jsonResponse({ body: message, status });

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

function siteOrigin(request) {
    const origin = request.headers.get("Origin");
    return origin && ALLOWED_ORIGINS.includes(origin) ? origin : SITE_URL;
}

function parseAddOns(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 30).map((a) => ({ id: String(a?.id ?? ""), qty: Number(a?.qty) }));
}

const iso = (ms) => (ms === null || ms === undefined ? null : new Date(ms).toISOString());

// D1 row -> what the browser and the email templates see.
function toApi(row) {
    return {
        ...row,
        add_ons: JSON.parse(row.add_ons || "[]"),
        created_at: iso(row.created_at),
        updated_at: iso(row.updated_at),
        starts_at: iso(row.starts_at),
        ends_at: iso(row.ends_at),
        blocked_until: iso(row.blocked_until),
        hold_expires_at: iso(row.hold_expires_at),
        confirmation_sent_at: iso(row.confirmation_sent_at),
        reminder_sent_at: iso(row.reminder_sent_at),
    };
}

async function loadSettings(db) {
    const row = await db.prepare("SELECT data FROM booking_settings WHERE id = 1").first();
    return normalizeSettings(row ? JSON.parse(row.data) : null);
}

// The live price list. No row yet means the defaults in src/data/packages.ts.
async function loadCatalog(db) {
    const row = await db.prepare("SELECT data FROM catalog WHERE id = 1").first();
    return catalogFrom(row ? JSON.parse(row.data) : null);
}

// Everyone on the team with an email gets a copy of every new booking and booking problem, as well as the business inbox.
async function teamEmails(db) {
    const { results } = await db.prepare("SELECT email FROM staff WHERE email != ''").all();
    return results.map((r) => r.email);
}

// What makes time unavailable between two instants: live bookings (pending ones only while their hold lasts) and
// blocked time off. Bookings keep their ids so a new booking can be checked against the others.
async function loadBusy(db, from, to, now) {
    const [bookings, blocked] = await db.batch([
        db
            .prepare(
                `SELECT id, created_at, starts_at, blocked_until FROM bookings
                 WHERE starts_at < ?1 AND blocked_until > ?2
                   AND (status = 'confirmed' OR (status = 'pending' AND (hold_expires_at IS NULL OR hold_expires_at > ?3)))`
            )
            .bind(to, from, now),
        db.prepare("SELECT starts_at, ends_at FROM blocked_times WHERE starts_at < ?1 AND ends_at > ?2").bind(to, from),
    ]);
    return {
        busy: bookings.results.map((b) => ({ id: b.id, created_at: b.created_at, start: b.starts_at, end: b.blocked_until })),
        blocked: blocked.results.map((b) => ({ start: b.starts_at, end: b.ends_at })),
    };
}

// A day's busy ranges can start the evening before (a late party plus its buffer), so look a day either side.
function dayWindow(firstDate, lastDate) {
    return {
        from: zonedToUtc(addDays(firstDate, -1), "00:00").getTime(),
        to: zonedToUtc(addDays(lastDate, 2), "00:00").getTime(),
    };
}

function bookingTimes(date, time, minutes, bufferMinutes) {
    const startsAt = zonedToUtc(date, time).getTime();
    const endsAt = startsAt + minutes * 60000;
    return { starts_at: startsAt, ends_at: endsAt, blocked_until: endsAt + bufferMinutes * 60000 };
}

async function insertBooking(db, fields) {
    const now = Date.now();
    const row = { id: crypto.randomUUID(), created_at: now, updated_at: now, ...fields, add_ons: JSON.stringify(fields.add_ons ?? []) };
    const keys = Object.keys(row);
    return db
        .prepare(`INSERT INTO bookings (${keys.join(", ")}) VALUES (${keys.map((_, i) => `?${i + 1}`).join(", ")}) RETURNING *`)
        .bind(...keys.map((k) => row[k]))
        .first();
}

// Column names come from this file only, never from the request.
async function updateBooking(db, id, fields, where = "") {
    const patch = { ...fields, updated_at: Date.now() };
    if (patch.add_ons) patch.add_ons = JSON.stringify(patch.add_ons);
    const keys = Object.keys(patch);
    return db
        .prepare(`UPDATE bookings SET ${keys.map((k, i) => `${k} = ?${i + 2}`).join(", ")} WHERE id = ?1 ${where} RETURNING *`)
        .bind(id, ...keys.map((k) => patch[k]))
        .first();
}

// ---- Public routes -------------------------------------------------------------------------------------------

// GET /api/booking/availability?package=gaming-2hr&addons=extra-hour:1&month=2026-11
async function handleAvailability(request, env) {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") ?? "";
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return fail("Pick a month.");
    const addOns = (url.searchParams.get("addons") ?? "")
        .split(",")
        .filter(Boolean)
        .map((pair) => {
            const [id, qty] = pair.split(":");
            return { id, qty: Number(qty ?? 1) };
        });

    const catalog = await loadCatalog(env.DB);
    let quote;
    try {
        quote = quoteBooking(url.searchParams.get("package") ?? "", addOns, catalog);
    } catch (error) {
        if (error instanceof BookingError) return fail(error.message);
        throw error;
    }

    const now = new Date();
    const today = zonedParts(now).date;
    const first = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const last = `${month}-${String(daysInMonth).padStart(2, "0")}`;
    if (last < today) return jsonResponse({ body: { days: {} } });

    const settings = await loadSettings(env.DB);
    const { from, to } = dayWindow(first, last);
    const { busy, blocked } = await loadBusy(env.DB, from, to, now.getTime());

    const days = {};
    for (let d = 1; d <= daysInMonth; d++) {
        const date = `${month}-${String(d).padStart(2, "0")}`;
        if (date < today) continue;
        const times = openStartTimes(date, quote.minutes, settings, busy, now, blocked);
        if (times.length) days[date] = times;
    }
    return jsonResponse({ body: { days, minutes: quote.minutes } });
}

// POST /api/booking/checkout: holds the slot as a pending booking and opens Stripe Checkout for the deposit.
async function handleCheckout(request, env) {
    const body = await request.json().catch(() => null);
    if (!body) return fail("Something went wrong. Please try again.");

    const date = text(body.date, 10);
    const time = text(body.time, 5);
    const customer = {
        customer_name: text(body.name, 100).replace(/\s+/g, " "),
        customer_email: text(body.email, 254).toLowerCase(),
        customer_phone: text(body.phone, 30),
        address: text(body.address, 300).replace(/\s+/g, " "),
        notes: text(body.notes, 2000),
    };

    const catalog = await loadCatalog(env.DB);
    let quote;
    try {
        quote = quoteBooking(text(body.package, 40), parseAddOns(body.addOns), catalog);
    } catch (error) {
        if (error instanceof BookingError) return fail(error.message);
        throw error;
    }
    if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) return fail("Please pick a date and time.");
    if (!customer.customer_name) return fail("Please enter your name.");
    if (!EMAIL_PATTERN.test(customer.customer_email)) return fail("Please enter a valid email address.");
    if (customer.customer_phone.replace(/\D/g, "").length < 10) return fail("Please enter a phone number we can reach you on.");
    if (customer.address.length < 8) return fail("Please enter the full party address.");
    const token = text(body.turnstile_token, 2048);
    if (!token || !(await verifyTurnstile(token, request, env))) {
        return fail("The spam check didn't go through. Please try again.", 403);
    }

    const db = env.DB;
    const now = Date.now();
    await db
        .prepare("UPDATE bookings SET status = 'expired', updated_at = ?1 WHERE status = 'pending' AND hold_expires_at < ?1")
        .bind(now)
        .run();

    const settings = await loadSettings(db);
    const { from, to } = dayWindow(date, date);
    const taken = () => fail("Sorry, that time was just taken. Please pick another.", 409);
    const before = await loadBusy(db, from, to, now);
    if (!openStartTimes(date, quote.minutes, settings, before.busy, new Date(now), before.blocked).includes(time)) return taken();

    const booking = await insertBooking(db, {
        ...customer,
        ...bookingTimes(date, time, quote.minutes, settings.buffer_minutes),
        status: "pending",
        source: "website",
        package_id: quote.pkg.id,
        package_name: quote.pkg.name,
        add_ons: quote.addOns,
        total_cents: toCents(quote.total),
        deposit_cents: toCents(quote.deposit),
        hold_expires_at: now + HOLD_MINUTES * 60000,
    });

    // Two people can pass the check above at the same moment. Look again now that this hold exists: if the slot is
    // over capacity, the hold created later gives way, so exactly one of them keeps it.
    const after = await loadBusy(db, from, to, now);
    const earlier = after.busy.filter(
        (b) => b.id !== booking.id && (b.created_at < booking.created_at || (b.created_at === booking.created_at && b.id < booking.id))
    );
    if (!slotFits(booking.starts_at, booking.blocked_until, settings.capacity, earlier, after.blocked)) {
        await db.prepare("DELETE FROM bookings WHERE id = ?1").bind(booking.id).run();
        return taken();
    }

    try {
        const stripe = getStripe(env);
        const origin = siteOrigin(request);
        const when = describeWhen(booking);
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            customer_email: customer.customer_email,
            client_reference_id: booking.id,
            metadata: { booking_id: booking.id },
            payment_intent_data: {
                description: `${quote.pkg.name} deposit for ${when}`,
                metadata: { booking_id: booking.id },
            },
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: "usd",
                        unit_amount: toCents(quote.deposit),
                        product_data: {
                            name: `${quote.pkg.name} deposit`,
                            description: `${when}. Holds your date. The remaining ${dollars(toCents(quote.balance))} is paid on the day of the party, preferably in cash.`,
                        },
                    },
                },
            ],
            expires_at: Math.floor(now / 1000) + CHECKOUT_MINUTES * 60 + 60,
            success_url: `${origin}/book/confirmed?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/book?package=${quote.pkg.id}&canceled=1&booking=${booking.id}`,
        });
        await updateBooking(db, booking.id, { stripe_session_id: session.id });
        return jsonResponse({ body: { url: session.url } });
    } catch (error) {
        console.error(`Couldn't start checkout for booking ${booking.id}:`, error);
        await updateBooking(db, booking.id, { status: "expired" });
        return fail("We couldn't open the payment page. Please try again or call us.", 502);
    }
}

// POST /api/booking/release { booking_id }: the customer backed out of Stripe Checkout. Expire their session so it can't
// be paid any more, then free the slot straight away instead of holding it until the hold runs out. The booking id is
// a random UUID that only the customer's cancel link carries.
async function handleRelease(request, env) {
    const body = await request.json().catch(() => null);
    const bookingId = text(body?.booking_id, 64);
    if (!/^[0-9a-f-]{36}$/.test(bookingId)) return fail("Missing booking reference.");
    const row = await env.DB.prepare("SELECT id, status, stripe_session_id FROM bookings WHERE id = ?1").bind(bookingId).first();
    if (!row || row.status !== "pending" || !row.stripe_session_id) return jsonResponse({ body: { released: false } });

    const stripe = getStripe(env);
    try {
        await stripe.checkout.sessions.expire(row.stripe_session_id);
    } catch {
        // Already paid or already expired. Paid wins: confirm it rather than freeing the slot.
        const session = await stripe.checkout.sessions.retrieve(row.stripe_session_id);
        if (session.status === "complete") {
            await confirmFromSession(env, session);
            return jsonResponse({ body: { released: false } });
        }
        if (session.status !== "expired") throw new Error(`Couldn't expire session for booking ${row.id}`);
    }
    await updateBooking(env.DB, row.id, { status: "expired" }, "AND status = 'pending'");
    return jsonResponse({ body: { released: true } });
}

// Marks a booking confirmed once its Checkout Session is paid, then sends the emails exactly once. Called by both
// the Stripe webhook and the confirmation page, whichever gets there first.
async function confirmFromSession(env, session) {
    const bookingId = session.metadata?.booking_id;
    if (!bookingId || session.payment_status !== "paid") return;
    const db = env.DB;

    const confirmed = await updateBooking(
        db,
        bookingId,
        {
            status: "confirmed",
            paid_cents: session.amount_total ?? 0,
            stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : null,
            hold_expires_at: null,
        },
        "AND status IN ('pending', 'expired')"
    );
    if (confirmed) {
        // A customer who pays after their hold ran out may have lost the slot to someone else in the meantime.
        const settings = await loadSettings(db);
        const { busy, blocked } = await loadBusy(db, confirmed.starts_at - 86400000, confirmed.blocked_until + 86400000, Date.now());
        const others = busy.filter((b) => b.id !== confirmed.id);
        if (!slotFits(confirmed.starts_at, confirmed.blocked_until, settings.capacity, others, blocked)) {
            await sendOwnerAlert(
                env,
                await teamEmails(db),
                "Double booking: please check /admin",
                `${confirmed.customer_name} paid a deposit for ${describeWhen(confirmed)}, but their hold had run out and the time now overlaps another booking. Please contact them at ${confirmed.customer_phone} or ${confirmed.customer_email}.`
            );
        }
    }

    // Claim the confirmation email so the webhook and the confirmation page can't both send it.
    const claimed = await updateBooking(
        db,
        bookingId,
        { confirmation_sent_at: Date.now() },
        "AND status = 'confirmed' AND confirmation_sent_at IS NULL"
    );
    if (claimed) {
        try {
            await sendBookingConfirmation(env, toApi(claimed), await teamEmails(db));
        } catch (emailError) {
            console.error("Booking confirmed but emails failed:", emailError);
            // Give the claim back so the next webhook retry or confirmation page check tries again.
            await updateBooking(db, bookingId, { confirmation_sent_at: null }, "AND confirmation_sent_at IS NOT NULL");
        }
    }
}

// GET /api/booking/status?session_id=cs_...: what the confirmation page shows after Stripe redirects back.
async function handleStatus(request, env) {
    const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
    if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return fail("Missing booking reference.");

    let session;
    try {
        session = await getStripe(env).checkout.sessions.retrieve(sessionId);
    } catch {
        return fail("We couldn't find that booking.", 404);
    }
    if (session.payment_status === "paid") await confirmFromSession(env, session);

    const booking = await env.DB.prepare("SELECT * FROM bookings WHERE stripe_session_id = ?1").bind(sessionId).first();
    if (!booking) return fail("We couldn't find that booking.", 404);
    return jsonResponse({ body: { booking: publicBooking(booking) } });
}

function publicBooking(b) {
    const start = zonedParts(new Date(b.starts_at));
    return {
        status: b.status,
        package_name: b.package_name,
        add_ons: JSON.parse(b.add_ons || "[]"),
        date: start.date,
        time: start.time,
        end_time: zonedParts(new Date(b.ends_at)).time,
        customer_name: b.customer_name,
        customer_email: b.customer_email,
        address: b.address,
        total_cents: b.total_cents,
        deposit_cents: b.deposit_cents,
        paid_cents: b.paid_cents,
    };
}

// POST /api/stripe/webhook
async function handleStripeWebhook(request, env) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
        console.error("STRIPE_WEBHOOK_SECRET is not set");
        return fail("Not configured", 500);
    }
    const stripe = getStripe(env);
    const payload = await request.text();
    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            payload,
            request.headers.get("Stripe-Signature") ?? "",
            env.STRIPE_WEBHOOK_SECRET,
            undefined,
            Stripe.createSubtleCryptoProvider()
        );
    } catch (error) {
        console.warn("Rejected webhook:", error.message);
        return fail("Bad signature", 400);
    }

    const session = event.data.object;
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        await confirmFromSession(env, session);
    } else if (event.type === "checkout.session.expired" && session.metadata?.booking_id) {
        await updateBooking(env.DB, session.metadata.booking_id, { status: "expired" }, "AND status = 'pending'");
    }
    return jsonResponse({ body: { received: true } });
}

// GET /api/booking/catalog: the live packages, add-ons and prices for the public pages and the booking page.
async function handleCatalog(request, env) {
    return jsonResponse({ body: { catalog: await loadCatalog(env.DB) } });
}

// POST /api/booking/send-reminders: emails customers the day before their party. The cron Worker in ../cron calls it
// every morning. It needs no secret: each booking gets one reminder at most, only for a party tomorrow and only during
// the day, so a second or stray call sends nothing extra.
async function handleSendReminders(request, env) {
    const now = new Date();
    const { date: today, time } = zonedParts(now);
    if (time < "08:00" || time >= "21:00") return jsonResponse({ body: { sent: 0, skipped: "outside 8 AM to 9 PM" } });
    const tomorrow = addDays(today, 1);
    const { results } = await env.DB.prepare(
        `SELECT id FROM bookings
         WHERE status = 'confirmed' AND reminder_sent_at IS NULL AND customer_email != ''
           AND starts_at >= ?1 AND starts_at < ?2 AND created_at < ?3`
    )
        // Someone who booked in the last 12 hours just got their confirmation, so they don't need a reminder too.
        .bind(zonedToUtc(tomorrow, "00:00").getTime(), zonedToUtc(addDays(tomorrow, 1), "00:00").getTime(), now.getTime() - 12 * 3600000)
        .all();

    let sent = 0;
    for (const { id } of results) {
        const claimed = await updateBooking(env.DB, id, { reminder_sent_at: Date.now() }, "AND reminder_sent_at IS NULL AND status = 'confirmed'");
        if (!claimed) continue;
        try {
            await sendReminder(env, toApi(claimed));
            sent++;
        } catch (error) {
            console.error(`Reminder for booking ${id} failed:`, error);
            await updateBooking(env.DB, id, { reminder_sent_at: null });
        }
    }
    return jsonResponse({ body: { sent } });
}

// ---- Secrets: admin sessions and the calendar feed -----------------------------------------------------------
// Both are signed with BOOKING_SECRET, a long random value set on Pages (falling back to the JWT_SECRET the Pages
// project already had). Changing it signs everyone out and changes the owner's calendar feed link.

const signingSecret = (env) => env.BOOKING_SECRET || env.JWT_SECRET;

async function hmacHex(secret, message) {
    if (!secret) throw new Error("BOOKING_SECRET (or JWT_SECRET) is not set");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
        "sign",
    ]);
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
    return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

const toHex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (bytes) => toHex(crypto.getRandomValues(new Uint8Array(bytes)));
const sha256Hex = async (value) => toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));

// The owner's feed link. Team members each get their own random link instead (staff.calendar_token).
const calendarToken = async (env) => (await hmacHex(signingSecret(env), "calendar-feed")).slice(0, 40);
const calendarUrl = (token) => `${SITE_URL}/api/booking/calendar.ics?token=${token}`;

// Session tokens are "expires.who.signature", where who is "owner" or a manager's staff id.
async function adminToken(env, expires, who) {
    return `${expires}.${who}.${await hmacHex(signingSecret(env), `admin-session:${expires}:${who}`)}`;
}

async function startSession(env, who, name) {
    const expires = Date.now() + ADMIN_SESSION_DAYS * 86400000;
    return { token: await adminToken(env, expires, who), expires, name };
}

// Who is signed in, or null. Removing a manager from the team (or making them a worker) signs them out.
async function adminUser(request, env) {
    const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const [expires, who] = token.split(".");
    if (!/^\d+$/.test(expires ?? "") || Number(expires) < Date.now() || !who) return null;
    if (!timingSafeEqual(token, await adminToken(env, expires, who))) return null;
    if (who === "owner") return { id: "owner", name: "Owner" };
    return await env.DB.prepare("SELECT id, name FROM staff WHERE id = ?1 AND role = 'manager'").bind(who).first();
}

// POST /api/admin/login { password, turnstile_token }
async function handleAdminLogin(request, env) {
    const body = await request.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";
    const token = text(body?.turnstile_token, 2048);
    if (!env.ADMIN_PASSWORD || !signingSecret(env)) return fail("Admin sign-in isn't set up yet.", 500);
    if (!token || !(await verifyTurnstile(token, request, env))) return fail("The spam check didn't go through. Please try again.", 403);
    // Compare digests so the check takes the same time whatever the password length.
    const [given, expected] = await Promise.all([
        hmacHex(signingSecret(env), `pw:${password}`),
        hmacHex(signingSecret(env), `pw:${env.ADMIN_PASSWORD}`),
    ]);
    if (!timingSafeEqual(given, expected)) return fail("Wrong password.", 401);
    return jsonResponse({ body: await startSession(env, "owner", "Owner") });
}

// POST /api/admin/login-link { email, turnstile_token }: emails a manager a one-time sign-in link. The reply is the
// same whether or not the email belongs to a manager, so the form can't be used to find out who's on the team.
async function handleAdminLoginLink(request, env) {
    const body = await request.json().catch(() => null);
    const email = text(body?.email, 200).toLowerCase();
    const token = text(body?.turnstile_token, 2048);
    if (!EMAIL_PATTERN.test(email)) return fail("Enter your email address.");
    if (!signingSecret(env)) return fail("Admin sign-in isn't set up yet.", 500);
    if (!token || !(await verifyTurnstile(token, request, env))) return fail("The spam check didn't go through. Please try again.", 403);
    const manager = await env.DB.prepare("SELECT id, name FROM staff WHERE email = ?1 AND role = 'manager'").bind(email).first();
    if (manager) {
        const code = randomHex(32);
        await env.DB.prepare("UPDATE staff SET login_code_hash = ?1, login_code_expires_at = ?2 WHERE id = ?3")
            .bind(await sha256Hex(code), Date.now() + LOGIN_LINK_MINUTES * 60000, manager.id)
            .run();
        await sendLoginLink(env, {
            to: email,
            name: manager.name,
            url: `${siteOrigin(request)}/admin?code=${manager.id}.${code}`,
            minutes: LOGIN_LINK_MINUTES,
        });
    }
    return jsonResponse({ body: { sent: true } });
}

// POST /api/admin/login-code { code }: trades the code from an emailed link for a session. Each link works once.
async function handleAdminLoginCode(request, env) {
    const body = await request.json().catch(() => null);
    const [id, code] = text(body?.code, 200).split(".");
    const expired = () => fail("That sign-in link has expired or was already used. Ask for a new one.", 401);
    if (!UUID.test(id ?? "") || !/^[0-9a-f]{64}$/.test(code ?? "")) return expired();
    const now = Date.now();
    const manager = await env.DB.prepare(
        `UPDATE staff SET login_code_hash = NULL, login_code_expires_at = NULL, last_login_at = ?1
         WHERE id = ?2 AND role = 'manager' AND login_code_hash = ?3 AND login_code_expires_at > ?1
         RETURNING id, name`
    )
        .bind(now, id, await sha256Hex(code))
        .first();
    if (!manager) return expired();
    return jsonResponse({ body: await startSession(env, manager.id, manager.name) });
}

// ---- Calendar feeds ------------------------------------------------------------------------------------------

const icsDate = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (value) =>
    String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r?\n/g, "\\n");

// Lines longer than 75 octets must be folded (RFC 5545).
function foldLine(line) {
    const encoder = new TextEncoder();
    if (encoder.encode(line).length <= 75) return line;
    const out = [];
    let current = "";
    let size = 0;
    for (const ch of line) {
        const len = encoder.encode(ch).length;
        if (size + len > (out.length ? 74 : 75)) {
            out.push(current);
            current = "";
            size = 0;
        }
        current += ch;
        size += len;
    }
    out.push(current);
    return out.join("\r\n ");
}

// GET /api/booking/calendar.ics?token=...: a secret link the owner or a team member subscribes to in Google or Apple
// Calendar.
async function handleCalendarFeed(request, env) {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const allowed =
        timingSafeEqual(token, await calendarToken(env)) ||
        (/^[0-9a-f]{40}$/.test(token) && (await env.DB.prepare("SELECT 1 FROM staff WHERE calendar_token = ?1").bind(token).first()));
    if (!allowed) return new Response("Not found", { status: 404 });

    const { results } = await env.DB.prepare("SELECT * FROM bookings WHERE status = 'confirmed' AND starts_at >= ?1 ORDER BY starts_at")
        .bind(Date.now() - 60 * 86400000)
        .all();

    const stamp = icsDate(Date.now());
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Prestigious Gaming on Wheels Plus//Bookings//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:PGOW Plus bookings",
        "REFRESH-INTERVAL;VALUE=DURATION:PT30M",
        "X-PUBLISHED-TTL:PT30M",
    ];
    for (const b of results) {
        const addOns = JSON.parse(b.add_ons || "[]")
            .map((a) => (a.qty > 1 ? `${a.name} x${a.qty}` : a.name))
            .join(", ");
        const details = [
            b.customer_name,
            b.customer_phone && `Phone: ${b.customer_phone}`,
            b.customer_email && `Email: ${b.customer_email}`,
            addOns && `Add-ons: ${addOns}`,
            `Total ${dollars(b.total_cents)}, paid ${dollars(b.paid_cents)}, due ${dollars(b.total_cents - b.paid_cents)}`,
            b.notes && `Customer notes: ${b.notes}`,
            b.admin_notes && `Team notes: ${b.admin_notes}`,
        ].filter(Boolean);
        lines.push(
            "BEGIN:VEVENT",
            `UID:${b.id}@prestigiousgamingonwheelsplus.com`,
            `DTSTAMP:${stamp}`,
            `DTSTART:${icsDate(b.starts_at)}`,
            `DTEND:${icsDate(b.ends_at)}`,
            `SUMMARY:${icsText(`${b.package_name}: ${b.customer_name}`)}`,
            `LOCATION:${icsText(b.address)}`,
            `DESCRIPTION:${icsText(details.join("\n"))}`,
            "END:VEVENT"
        );
    }
    lines.push("END:VCALENDAR");
    return new Response(lines.map(foldLine).join("\r\n") + "\r\n", {
        headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" },
    });
}

// ---- Admin API -----------------------------------------------------------------------------------------------

const STATUSES = ["pending", "confirmed", "cancelled", "expired"];

async function handleAdminListBookings(request, env) {
    const url = new URL(request.url);
    const where = [];
    const args = [];
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (from && DATE_PATTERN.test(from)) {
        args.push(zonedToUtc(from, "00:00").getTime());
        where.push(`starts_at >= ?${args.length}`);
    }
    if (to && DATE_PATTERN.test(to)) {
        args.push(zonedToUtc(addDays(to, 1), "00:00").getTime());
        where.push(`starts_at < ?${args.length}`);
    }
    // Only known status names make it into the SQL.
    const statuses = (url.searchParams.get("status") ?? "").split(",").filter((s) => STATUSES.includes(s));
    if (statuses.length) where.push(`status IN (${statuses.map((s) => `'${s}'`).join(", ")})`);
    const { results } = await env.DB.prepare(
        `SELECT * FROM bookings ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY starts_at LIMIT 500`
    )
        .bind(...args)
        .all();
    return jsonResponse({ body: { bookings: results.map(toApi) } });
}

// Manual bookings: phone bookings, school and corporate events, anything outside the online packages.
async function handleAdminCreateBooking(request, env) {
    const body = await request.json().catch(() => null);
    if (!body) return fail("Missing booking details.");
    const date = text(body.date, 10);
    const time = text(body.time, 5);
    if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) return fail("Pick a date and start time.");

    let packageName;
    let minutes;
    let addOns = [];
    let totalCents = 0;
    const catalog = await loadCatalog(env.DB);
    const pkg = findPackage(text(body.package, 40), catalog);
    if (pkg) {
        let quote;
        try {
            quote = quoteBooking(pkg.id, parseAddOns(body.addOns), catalog);
        } catch (error) {
            if (error instanceof BookingError) return fail(error.message);
            throw error;
        }
        packageName = pkg.name;
        minutes = quote.minutes;
        addOns = quote.addOns;
        totalCents = toCents(quote.total);
    } else {
        packageName = text(body.package_name, 120);
        minutes = Math.round(Number(body.minutes));
        if (!packageName) return fail("Name the event.");
        if (!Number.isFinite(minutes) || minutes < 15 || minutes > 24 * 60) return fail("Enter how long the event lasts.");
    }
    if (body.total !== undefined && body.total !== "") totalCents = toCents(Number(body.total));
    const paidCents = toCents(Number(body.paid || 0));
    if (!Number.isFinite(totalCents) || !Number.isFinite(paidCents)) return fail("Check the amounts.");

    const name = text(body.name, 100);
    if (!name) return fail("Enter the customer's name.");

    const settings = await loadSettings(env.DB);
    const booking = await insertBooking(env.DB, {
        ...bookingTimes(date, time, minutes, settings.buffer_minutes),
        status: "confirmed",
        // Bookings carried over from 10to8 are tagged so they're easy to spot.
        source: body.source === "10to8" ? "10to8" : "manual",
        external_ref: text(body.external_ref, 100) || null,
        package_id: pkg ? pkg.id : "custom",
        package_name: packageName,
        add_ons: addOns,
        customer_name: name,
        customer_email: text(body.email, 254).toLowerCase(),
        customer_phone: text(body.phone, 30),
        address: text(body.address, 300),
        notes: text(body.notes, 2000),
        admin_notes: text(body.admin_notes, 2000),
        total_cents: totalCents,
        deposit_cents: paidCents,
        paid_cents: paidCents,
    });
    return jsonResponse({ body: { booking: toApi(booking) }, status: 201 });
}

// Cancel, restore, reschedule, record payments or edit notes.
async function handleAdminUpdateBooking(request, env, id) {
    const body = await request.json().catch(() => null);
    if (!body) return fail("Nothing to change.");
    const current = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?1").bind(id).first();
    if (!current) return fail("Booking not found.", 404);

    const patch = {};
    if (body.status !== undefined) {
        if (!["confirmed", "cancelled"].includes(body.status)) return fail("Bookings can only be confirmed or cancelled here.");
        patch.status = body.status;
        if (body.status === "confirmed") patch.hold_expires_at = null;
    }
    for (const key of ["admin_notes", "notes", "address", "customer_phone", "customer_name", "customer_email"]) {
        if (typeof body[key] === "string") patch[key] = text(body[key], key.endsWith("notes") ? 2000 : 300);
    }
    if (body.paid !== undefined) patch.paid_cents = toCents(Number(body.paid));
    if (body.total !== undefined) patch.total_cents = toCents(Number(body.total));
    if ([patch.paid_cents, patch.total_cents].some((v) => v !== undefined && !Number.isFinite(v))) return fail("Check the amounts.");

    if (body.date !== undefined || body.time !== undefined) {
        const date = text(body.date, 10);
        const time = text(body.time, 5);
        if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) return fail("Pick a date and start time.");
        const minutes = Math.round((current.ends_at - current.starts_at) / 60000);
        const buffer = Math.round((current.blocked_until - current.ends_at) / 60000);
        Object.assign(patch, bookingTimes(date, time, minutes, buffer));
    }

    const updated = await updateBooking(env.DB, id, patch);
    return jsonResponse({ body: { booking: toApi(updated) } });
}

async function handleAdminGetSettings(request, env) {
    const [settings, blocked] = await Promise.all([
        loadSettings(env.DB),
        env.DB.prepare("SELECT * FROM blocked_times WHERE ends_at >= ?1 ORDER BY starts_at").bind(Date.now()).all(),
    ]);
    return jsonResponse({
        body: {
            settings,
            blocked: blocked.results.map((b) => ({ ...b, starts_at: iso(b.starts_at), ends_at: iso(b.ends_at) })),
        },
    });
}

async function handleAdminSaveSettings(request, env) {
    const body = await request.json().catch(() => null);
    if (!body) return fail("Nothing to save.");
    const settings = normalizeSettings(body);
    await env.DB.prepare(
        "INSERT INTO booking_settings (id, data, updated_at) VALUES (1, ?1, ?2) ON CONFLICT (id) DO UPDATE SET data = ?1, updated_at = ?2"
    )
        .bind(JSON.stringify(settings), Date.now())
        .run();
    return jsonResponse({ body: { settings } });
}

// PUT /api/admin/catalog { packages, addOnGroups }: saves the price list. The website and booking page use it straight
// away; the prerendered pages pick it up on the next deploy and update in the browser until then.
async function handleAdminSaveCatalog(request, env) {
    const { catalog, error } = parseCatalog(await request.json().catch(() => null));
    if (error) return fail(error);
    await env.DB.prepare(
        "INSERT INTO catalog (id, data, updated_at) VALUES (1, ?1, ?2) ON CONFLICT (id) DO UPDATE SET data = ?1, updated_at = ?2"
    )
        .bind(JSON.stringify(catalog), Date.now())
        .run();
    return jsonResponse({ body: { catalog } });
}

// Blocks whole days (New York time), from start_date through end_date.
async function handleAdminAddBlocked(request, env) {
    const body = await request.json().catch(() => null);
    const start = text(body?.start_date, 10);
    const end = text(body?.end_date, 10) || start;
    if (!DATE_PATTERN.test(start) || !DATE_PATTERN.test(end) || end < start) return fail("Pick the days to block.");
    const row = await env.DB.prepare(
        "INSERT INTO blocked_times (id, created_at, starts_at, ends_at, reason) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING *"
    )
        .bind(
            crypto.randomUUID(),
            Date.now(),
            zonedToUtc(start, "00:00").getTime(),
            zonedToUtc(addDays(end, 1), "00:00").getTime(),
            text(body.reason, 200)
        )
        .first();
    return jsonResponse({ body: { blocked: { ...row, starts_at: iso(row.starts_at), ends_at: iso(row.ends_at) } }, status: 201 });
}

async function handleAdminDeleteBlocked(request, env, id) {
    await env.DB.prepare("DELETE FROM blocked_times WHERE id = ?1").bind(id).run();
    return jsonResponse({ body: null, status: 204 });
}

// ---- Team: managers and workers ------------------------------------------------------------------------------

const toStaffApi = (row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    last_login_at: iso(row.last_login_at),
    calendarUrl: calendarUrl(row.calendar_token),
});

async function handleAdminListStaff(request, env, me) {
    const { results } = await env.DB.prepare("SELECT * FROM staff ORDER BY role, name COLLATE NOCASE").all();
    return jsonResponse({
        body: { me: me.id, staff: results.map(toStaffApi), ownerCalendarUrl: calendarUrl(await calendarToken(env)) },
    });
}

function staffFields(body) {
    const fields = {
        name: text(body?.name, 80),
        email: text(body?.email, 200).toLowerCase(),
        role: body?.role === "manager" ? "manager" : "worker",
    };
    if (!fields.name) return { error: "Enter their name." };
    if (fields.email && !EMAIL_PATTERN.test(fields.email)) return { error: "That email doesn't look right." };
    if (fields.role === "manager" && !fields.email) return { error: "Managers need an email address to sign in." };
    return { fields };
}

const duplicateEmail = (error) => /UNIQUE/i.test(String(error?.message)) && /email/i.test(String(error?.message));

// POST /api/admin/staff { name, email, role }
async function handleAdminAddStaff(request, env) {
    const { fields, error } = staffFields(await request.json().catch(() => null));
    if (error) return fail(error);
    try {
        const row = await env.DB.prepare(
            "INSERT INTO staff (id, created_at, name, email, role, calendar_token) VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING *"
        )
            .bind(crypto.randomUUID(), Date.now(), fields.name, fields.email, fields.role, randomHex(20))
            .first();
        return jsonResponse({ body: { member: toStaffApi(row) }, status: 201 });
    } catch (err) {
        if (duplicateEmail(err)) return fail("Someone on the team already uses that email.");
        throw err;
    }
}

// PATCH /api/admin/staff/:id { name, email, role } or { new_calendar_link: true }
async function handleAdminUpdateStaff(request, env, me, id) {
    const body = await request.json().catch(() => null);
    let row;
    if (body?.new_calendar_link) {
        row = await env.DB.prepare("UPDATE staff SET calendar_token = ?1 WHERE id = ?2 RETURNING *").bind(randomHex(20), id).first();
    } else {
        const { fields, error } = staffFields(body);
        if (error) return fail(error);
        if (id === me.id && fields.role !== "manager") return fail("You can't take away your own manager access.");
        try {
            row = await env.DB.prepare("UPDATE staff SET name = ?1, email = ?2, role = ?3 WHERE id = ?4 RETURNING *")
                .bind(fields.name, fields.email, fields.role, id)
                .first();
        } catch (err) {
            if (duplicateEmail(err)) return fail("Someone on the team already uses that email.");
            throw err;
        }
    }
    if (!row) return fail("Not Found", 404);
    return jsonResponse({ body: { member: toStaffApi(row) } });
}

async function handleAdminDeleteStaff(request, env, me, id) {
    if (id === me.id) return fail("You can't remove yourself.");
    await env.DB.prepare("DELETE FROM staff WHERE id = ?1").bind(id).run();
    return jsonResponse({ body: null, status: 204 });
}

// ---- Router --------------------------------------------------------------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Returns a Response for booking routes, or null so the main worker can carry on.
export async function routeBooking(request, env, url) {
    const path = url.pathname;
    const method = request.method;
    if (!path.startsWith("/api/booking/") && !path.startsWith("/api/admin/") && path !== "/api/stripe/webhook") return null;
    if (!env.DB) {
        console.error("The D1 binding DB is missing");
        return fail("Online booking is temporarily unavailable. Please call us to book.", 503);
    }
    try {
        if (path === "/api/booking/availability" && method === "GET") return await handleAvailability(request, env);
        if (path === "/api/booking/checkout" && method === "POST") return await handleCheckout(request, env);
        if (path === "/api/booking/status" && method === "GET") return await handleStatus(request, env);
        if (path === "/api/booking/release" && method === "POST") return await handleRelease(request, env);
        if (path === "/api/booking/calendar.ics" && method === "GET") return await handleCalendarFeed(request, env);
        if (path === "/api/booking/catalog" && method === "GET") return await handleCatalog(request, env);
        if (path === "/api/booking/send-reminders" && method === "POST") return await handleSendReminders(request, env);
        if (path === "/api/stripe/webhook" && method === "POST") return await handleStripeWebhook(request, env);
        if (path === "/api/admin/login" && method === "POST") return await handleAdminLogin(request, env);
        if (path === "/api/admin/login-link" && method === "POST") return await handleAdminLoginLink(request, env);
        if (path === "/api/admin/login-code" && method === "POST") return await handleAdminLoginCode(request, env);

        if (path.startsWith("/api/admin/")) {
            const me = await adminUser(request, env);
            if (!me) return fail("Please sign in again.", 401);
            const [, , , resource, id] = path.split("/");
            if (id !== undefined && !UUID.test(id)) return fail("Not Found", 404);
            if (resource === "bookings") {
                if (!id && method === "GET") return await handleAdminListBookings(request, env);
                if (!id && method === "POST") return await handleAdminCreateBooking(request, env);
                if (id && method === "PATCH") return await handleAdminUpdateBooking(request, env, id);
            }
            if (resource === "settings" && !id) {
                if (method === "GET") return await handleAdminGetSettings(request, env);
                if (method === "PUT") return await handleAdminSaveSettings(request, env);
            }
            if (resource === "catalog" && !id && method === "PUT") return await handleAdminSaveCatalog(request, env);
            if (resource === "blocked") {
                if (!id && method === "POST") return await handleAdminAddBlocked(request, env);
                if (id && method === "DELETE") return await handleAdminDeleteBlocked(request, env, id);
            }
            if (resource === "staff") {
                if (!id && method === "GET") return await handleAdminListStaff(request, env, me);
                if (!id && method === "POST") return await handleAdminAddStaff(request, env);
                if (id && method === "PATCH") return await handleAdminUpdateStaff(request, env, me, id);
                if (id && method === "DELETE") return await handleAdminDeleteStaff(request, env, me, id);
            }
        }
        return fail("Not Found", 404);
    } catch (error) {
        console.error(`${method} ${path} failed:`, error);
        return fail("Something went wrong on our end. Please try again or call us.", 500);
    }
}

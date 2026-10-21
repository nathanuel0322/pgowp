// Bookings stored in Cloudflare D1 (SQLite), bound to the Pages project as `DB`. The tables are created on first
// use, so a new, empty database needs no setup.
//
// Times are saved as UTC ISO strings (2026-10-31T21:00:00.000Z), which sort and compare correctly as text.
// Money is saved in whole cents so amounts like $437.50 add up exactly.
import type { BookingSettings } from "./schedule";
import type { BlockRow, BookingRow, NewBooking, Status, Store } from "./server";

// The parts of Cloudflare's D1 binding used here.
export interface D1Database {
    prepare(sql: string): D1PreparedStatement;
    batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = Record<string, unknown>>(): Promise<T | null>;
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    run(): Promise<unknown>;
}

export const SCHEMA = [
    `CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        -- hold: waiting on the deposit payment (expires at hold_expires_at)
        -- requested: deposit paid, waiting for the owner to confirm
        status TEXT NOT NULL CHECK (status IN ('hold', 'requested', 'confirmed', 'declined', 'cancelled')),
        -- online: booked on the website. admin: added by hand (phone bookings, bookings moved over from 10to8).
        source TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online', 'admin')),
        package_id TEXT NOT NULL,
        add_ons TEXT NOT NULL DEFAULT '[]',
        extra_hours INTEGER NOT NULL DEFAULT 0,
        guests INTEGER NOT NULL DEFAULT 1,
        start_at TEXT NOT NULL,
        end_at TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        address TEXT,
        guest_of_honor TEXT,
        notes TEXT,
        admin_notes TEXT,
        -- Prices as they were when the party was booked, so later price changes don't rewrite old bookings.
        total_cents INTEGER NOT NULL DEFAULT 0,
        deposit_cents INTEGER NOT NULL DEFAULT 0,
        paid_cents INTEGER NOT NULL DEFAULT 0,
        refunded_cents INTEGER NOT NULL DEFAULT 0,
        stripe_session_id TEXT UNIQUE,
        stripe_payment_intent TEXT,
        hold_expires_at TEXT,
        CHECK (end_at > start_at)
    )`,
    `CREATE INDEX IF NOT EXISTS bookings_start_at ON bookings (start_at)`,
    // Time off: holidays, vacations, days the trailer is in the shop. Closes the calendar for every crew.
    `CREATE TABLE IF NOT EXISTS blocked_times (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        start_at TEXT NOT NULL,
        end_at TEXT NOT NULL,
        reason TEXT,
        CHECK (end_at > start_at)
    )`,
    `CREATE INDEX IF NOT EXISTS blocked_times_start_at ON blocked_times (start_at)`,
    // One row of booking settings (hours, crews, gap between parties), edited from the admin page.
    `CREATE TABLE IF NOT EXISTS booking_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        settings TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )`,
];

const MONEY = ["total", "deposit", "paid", "refunded"] as const;
// Every column a booking update may set, so nothing else can end up in the SQL.
const COLUMNS = new Set<string>([
    "status",
    "source",
    "package_id",
    "add_ons",
    "extra_hours",
    "guests",
    "start_at",
    "end_at",
    "customer_name",
    "customer_email",
    "customer_phone",
    "address",
    "guest_of_honor",
    "notes",
    "admin_notes",
    ...MONEY,
    "stripe_session_id",
    "stripe_payment_intent",
    "hold_expires_at",
]);

const iso = (value: string) => new Date(value).toISOString();
const cents = (dollars: number) => Math.round(Number(dollars) * 100);

// A booking field and its value as saved in the table.
function toColumn(key: string, value: unknown): [string, unknown] {
    if ((MONEY as readonly string[]).includes(key)) return [`${key}_cents`, cents(value as number)];
    if (key === "add_ons") return [key, JSON.stringify(value)];
    if ((key === "start_at" || key === "end_at" || key === "hold_expires_at") && typeof value === "string") return [key, iso(value)];
    return [key, value ?? null];
}

function toBooking(r: Record<string, unknown>): BookingRow {
    const { total_cents, deposit_cents, paid_cents, refunded_cents, add_ons, ...rest } = r;
    return {
        ...(rest as Omit<BookingRow, (typeof MONEY)[number] | "add_ons">),
        add_ons: JSON.parse(String(add_ons ?? "[]")),
        total: Number(total_cents) / 100,
        deposit: Number(deposit_cents) / 100,
        paid: Number(paid_cents) / 100,
        refunded: Number(refunded_cents) / 100,
    };
}

export function d1Store(db: D1Database | undefined, newId: () => string = () => crypto.randomUUID()): Store {
    // Creates the tables once per worker instance. A failure is retried on the next request.
    let ready: Promise<unknown> | undefined;
    const init = () => {
        if (!db) throw new Error("No D1 database is bound to the site as DB. See BOOKING.md.");
        ready ??= db.batch(SCHEMA.map((s) => db.prepare(s))).catch((error) => {
            ready = undefined;
            throw error;
        });
        return ready;
    };
    const q = async (sql: string, ...values: unknown[]) => {
        await init();
        return db!.prepare(sql).bind(...values);
    };
    const between = (from: number, to: number) => [new Date(to).toISOString(), new Date(from).toISOString()];
    const getBooking = async (id: string) => {
        const row = await (await q("SELECT * FROM bookings WHERE id = ?", id)).first();
        return row ? toBooking(row) : null;
    };

    return {
        async bookingsBetween(from, to) {
            const { results } = await (await q("SELECT * FROM bookings WHERE start_at < ? AND end_at > ? ORDER BY start_at", ...between(from, to))).all();
            return results.map(toBooking);
        },
        async blocksBetween(from, to) {
            const { results } = await (
                await q("SELECT * FROM blocked_times WHERE start_at < ? AND end_at > ? ORDER BY start_at", ...between(from, to))
            ).all<BlockRow>();
            return results;
        },
        getBooking,
        async insertBooking(booking: NewBooking) {
            const columns = Object.entries({ id: newId(), created_at: new Date().toISOString(), ...booking }).map(([k, v]) =>
                k === "id" || k === "created_at" ? [k, v] : toColumn(k, v)
            );
            const sql = `INSERT INTO bookings (${columns.map(([k]) => k).join(", ")}) VALUES (${columns.map(() => "?").join(", ")}) RETURNING *`;
            return toBooking((await (await q(sql, ...columns.map(([, v]) => v))).first())!);
        },
        async updateBooking(id, patch, fromStatuses?: Status[]) {
            const columns = Object.entries(patch)
                .filter(([k, v]) => COLUMNS.has(k) && v !== undefined)
                .map(([k, v]) => toColumn(k, v));
            if (!columns.length) return getBooking(id);
            let sql = `UPDATE bookings SET ${columns.map(([k]) => `${k} = ?`).join(", ")} WHERE id = ?`;
            const values = [...columns.map(([, v]) => v), id];
            if (fromStatuses) {
                sql += ` AND status IN (${fromStatuses.map(() => "?").join(", ")})`;
                values.push(...fromStatuses);
            }
            const row = await (await q(`${sql} RETURNING *`, ...values)).first();
            return row ? toBooking(row) : null;
        },
        async insertBlock(block) {
            return (await (
                await q(
                    "INSERT INTO blocked_times (id, created_at, start_at, end_at, reason) VALUES (?, ?, ?, ?, ?) RETURNING *",
                    newId(),
                    new Date().toISOString(),
                    iso(block.start_at),
                    iso(block.end_at),
                    block.reason
                )
            ).first<BlockRow>())!;
        },
        async deleteBlock(id) {
            await (await q("DELETE FROM blocked_times WHERE id = ?", id)).run();
        },
        async getSettings() {
            const row = await (await q("SELECT settings FROM booking_settings WHERE id = 1")).first<{ settings: string }>();
            return row ? (JSON.parse(row.settings) as Partial<BookingSettings>) : null;
        },
        async saveSettings(settings) {
            await (
                await q(
                    "INSERT INTO booking_settings (id, settings, updated_at) VALUES (1, ?, ?) " +
                        "ON CONFLICT (id) DO UPDATE SET settings = excluded.settings, updated_at = excluded.updated_at",
                    JSON.stringify(settings),
                    new Date().toISOString()
                )
            ).run();
        },
    };
}

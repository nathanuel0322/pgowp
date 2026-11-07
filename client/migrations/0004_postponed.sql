-- Adds the 'postponed' status: a party that's off its date, with its payment kept, until a new date is picked on
-- /admin. Like cancelled, it frees the time slot and leaves the calendars and reminder emails.
-- SQLite can't change a CHECK constraint in place, so the table is rebuilt and every row copied across.

CREATE TABLE bookings_new (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    -- pending: waiting on Stripe Checkout, holds the slot until hold_expires_at.
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'postponed', 'cancelled', 'expired')),
    source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', '10to8', 'manual')),
    package_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    -- JSON: [{ id, name, unitPrice, qty, total }]
    add_ons TEXT NOT NULL DEFAULT '[]',
    starts_at INTEGER NOT NULL,
    ends_at INTEGER NOT NULL,
    -- ends_at plus the travel/setup buffer. The slot stays unavailable until then.
    blocked_until INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL DEFAULT '',
    customer_phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    -- Owner-only notes from /admin.
    admin_notes TEXT NOT NULL DEFAULT '',
    total_cents INTEGER NOT NULL DEFAULT 0,
    deposit_cents INTEGER NOT NULL DEFAULT 0,
    paid_cents INTEGER NOT NULL DEFAULT 0,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent TEXT,
    hold_expires_at INTEGER,
    confirmation_sent_at INTEGER,
    -- Appointment reference from 10to8, for imported bookings.
    external_ref TEXT UNIQUE,
    reminder_sent_at INTEGER,
    CHECK (starts_at < ends_at AND ends_at <= blocked_until)
);

INSERT INTO bookings_new (
    id, created_at, updated_at, status, source, package_id, package_name, add_ons, starts_at, ends_at, blocked_until,
    customer_name, customer_email, customer_phone, address, notes, admin_notes, total_cents, deposit_cents, paid_cents,
    stripe_session_id, stripe_payment_intent, hold_expires_at, confirmation_sent_at, external_ref, reminder_sent_at
)
SELECT
    id, created_at, updated_at, status, source, package_id, package_name, add_ons, starts_at, ends_at, blocked_until,
    customer_name, customer_email, customer_phone, address, notes, admin_notes, total_cents, deposit_cents, paid_cents,
    stripe_session_id, stripe_payment_intent, hold_expires_at, confirmation_sent_at, external_ref, reminder_sent_at
FROM bookings;

DROP TABLE bookings;
ALTER TABLE bookings_new RENAME TO bookings;

CREATE INDEX IF NOT EXISTS bookings_starts_at_idx ON bookings (starts_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

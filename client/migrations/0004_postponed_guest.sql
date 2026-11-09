-- Postponed bookings (a party waiting for a new date) and the guest of honor details asked for on /book.
-- SQLite can't change a CHECK constraint, so the table is rebuilt with 'postponed' allowed.
CREATE TABLE bookings_new (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    -- pending: waiting on Stripe Checkout, holds the slot until hold_expires_at.
    -- postponed: waiting for a new date. Like cancelled and expired, it never holds a slot.
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired', 'postponed')),
    source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', '10to8', 'manual')),
    package_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    add_ons TEXT NOT NULL DEFAULT '[]',
    starts_at INTEGER NOT NULL,
    ends_at INTEGER NOT NULL,
    blocked_until INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL DEFAULT '',
    customer_phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    admin_notes TEXT NOT NULL DEFAULT '',
    total_cents INTEGER NOT NULL DEFAULT 0,
    deposit_cents INTEGER NOT NULL DEFAULT 0,
    paid_cents INTEGER NOT NULL DEFAULT 0,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent TEXT,
    hold_expires_at INTEGER,
    confirmation_sent_at INTEGER,
    external_ref TEXT UNIQUE,
    reminder_sent_at INTEGER,
    guest_name TEXT NOT NULL DEFAULT '',
    guest_age TEXT NOT NULL DEFAULT '',
    shirt_size TEXT NOT NULL DEFAULT '',
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

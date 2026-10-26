-- Online booking, replacing 10to8. Cloudflare D1 (SQLite), bound to the Pages project as DB.
-- Times are milliseconds since the epoch (UTC). Money is in cents.

CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    -- pending: waiting on Stripe Checkout, holds the slot until hold_expires_at.
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
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
    CHECK (starts_at < ends_at AND ends_at <= blocked_until)
);

CREATE INDEX IF NOT EXISTS bookings_starts_at_idx ON bookings (starts_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

-- Single row of scheduling rules (JSON, see BookingSettings in src/lib/booking.ts), edited on /admin.
CREATE TABLE IF NOT EXISTS booking_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Days off, vacations and anything else that shouldn't be bookable online.
CREATE TABLE IF NOT EXISTS blocked_times (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    starts_at INTEGER NOT NULL,
    ends_at INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    CHECK (starts_at < ends_at)
);

CREATE INDEX IF NOT EXISTS blocked_times_range_idx ON blocked_times (starts_at, ends_at);

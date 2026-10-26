-- Live price list managers edit on /admin (src/lib/catalog.ts), and the day-before reminder emails.
CREATE TABLE IF NOT EXISTS catalog (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

ALTER TABLE bookings ADD COLUMN reminder_sent_at INTEGER;

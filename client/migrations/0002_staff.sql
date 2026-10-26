-- The team: managers who sign in to /admin with an emailed link, and workers who only get a calendar link.
-- The owner isn't a row here; they sign in with ADMIN_PASSWORD.

CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    name TEXT NOT NULL,
    -- Lowercase. Required for managers, who sign in with it.
    email TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('manager', 'worker')),
    -- Secret part of this person's calendar feed link. Replacing it turns the old link off.
    calendar_token TEXT NOT NULL UNIQUE,
    -- SHA-256 of the one-time code in the latest emailed sign-in link, cleared once it's used.
    login_code_hash TEXT,
    login_code_expires_at INTEGER,
    last_login_at INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS staff_email_idx ON staff (email) WHERE email != '';

-- Online booking tables. Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Safe to run again; it only creates what's missing.
--
-- Row level security is on with no policies, so the browser's public key can't read or change any of this.
-- Only the site's worker (which holds the service-role key) touches these tables.

create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    -- hold: waiting on the deposit payment (expires at hold_expires_at)
    -- requested: deposit paid, waiting for you to confirm
    -- confirmed, declined, cancelled
    status text not null check (status in ('hold', 'requested', 'confirmed', 'declined', 'cancelled')),
    -- online: booked on the website. admin: added by hand (phone bookings, bookings moved over from 10to8).
    source text not null default 'online' check (source in ('online', 'admin')),
    package_id text not null,
    add_ons text[] not null default '{}',
    extra_hours int not null default 0,
    guests int not null default 1,
    start_at timestamptz not null,
    end_at timestamptz not null,
    customer_name text not null,
    customer_email text,
    customer_phone text,
    address text,
    guest_of_honor text,
    notes text,
    admin_notes text,
    -- Prices are saved as they were when the party was booked, so later price changes don't rewrite old bookings.
    total numeric(10, 2) not null default 0,
    deposit numeric(10, 2) not null default 0,
    paid numeric(10, 2) not null default 0,
    refunded numeric(10, 2) not null default 0,
    stripe_session_id text unique,
    stripe_payment_intent text,
    hold_expires_at timestamptz,
    check (end_at > start_at)
);

create index if not exists bookings_start_at_idx on public.bookings (start_at);
alter table public.bookings enable row level security;

-- Time off: holidays, vacations, days the trailer is in the shop. Closes the calendar for every crew.
create table if not exists public.blocked_times (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    start_at timestamptz not null,
    end_at timestamptz not null,
    reason text,
    check (end_at > start_at)
);

create index if not exists blocked_times_start_at_idx on public.blocked_times (start_at);
alter table public.blocked_times enable row level security;

-- One row of booking settings (hours, crews, gap between parties). Edited from the admin page.
create table if not exists public.booking_settings (
    id int primary key default 1 check (id = 1),
    settings jsonb not null,
    updated_at timestamptz not null default now()
);

alter table public.booking_settings enable row level security;

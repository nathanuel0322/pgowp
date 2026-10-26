import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdContentCopy, MdLogout, MdOpenInNew, MdPhone, MdPlace, MdSms } from "react-icons/md";
import { apilink, toastError, toastSuccess } from "../GlobalFunctions";
import { field } from "../components/booking/field";
import Turnstile, { TurnstileHandle } from "../components/Turnstile";
import { PARTY_PACKAGES, formatPrice } from "../data/packages";
import {
    BOOKABLE_ADD_ON_GROUPS,
    TIME_ZONE,
    addDays,
    formatDate,
    formatTime,
    type AddOnChoice,
    type BookingSettings,
    type PricedLine,
} from "../lib/booking";
import { calendarLinks, subscribePageUrl } from "../lib/calendar";
import { SITE } from "../site";

// Bookings dashboard: bookings, manual bookings, hours, time off and the team's calendar links. The owner signs in
// with the ADMIN_PASSWORD set on Pages, managers with a one-time link emailed to them. The worker checks the signed
// session token on every request.

interface Booking {
    id: string;
    status: "pending" | "confirmed" | "cancelled" | "expired";
    source: "website" | "10to8" | "manual";
    package_id: string;
    package_name: string;
    add_ons: PricedLine[];
    starts_at: string;
    ends_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    address: string;
    notes: string;
    admin_notes: string;
    total_cents: number;
    paid_cents: number;
    stripe_payment_intent: string | null;
}

interface Blocked {
    id: string;
    starts_at: string;
    ends_at: string;
    reason: string;
}

interface Member {
    id: string;
    name: string;
    email: string;
    role: "manager" | "worker";
    last_login_at: string | null;
    calendarUrl: string;
}

const small = field.replace("px-4 py-3.5 text-[15px]", "px-3 py-2.5 text-sm");
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

const nyParts = (iso: string) => {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE }),
        time: d.toLocaleTimeString("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }),
    };
};

const money = (cents: number) => formatPrice(cents / 100);

const TOKEN_KEY = "admin-session";

// Signed session token from the sign-in routes. signOut is called on any 401 so an expired session lands back on the
// sign-in form.
interface AdminSession {
    token: string;
    name: string;
    signOut(): void;
}

interface SavedSession {
    token: string;
    expires: number;
    name: string;
}

function readSession(): SavedSession | null {
    try {
        const saved = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "null");
        // Tokens from before manager sign-in have two parts and no longer work.
        return saved && saved.expires > Date.now() && saved.token.split(".").length === 3 ? saved : null;
    } catch {
        return null;
    }
}

function useApi(session: AdminSession) {
    return useCallback(
        async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
            const res = await fetch(`${apilink}${path}`, {
                ...init,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.token}`,
                    ...(init.headers ?? {}),
                },
            });
            if (res.status === 204) return null as T;
            const json = await res.json().catch(() => null);
            if (res.status === 401) session.signOut();
            if (!res.ok) throw new Error(json?.message ?? "Something went wrong.");
            return json as T;
        },
        [session]
    );
}

export default function Admin() {
    const [saved, setSaved] = useState<SavedSession | null>(null);
    const [checking, setChecking] = useState(true);
    const [tab, setTab] = useState<"bookings" | "add" | "settings" | "team">("bookings");

    const signedIn = useCallback((s: SavedSession) => {
        try {
            localStorage.setItem(TOKEN_KEY, JSON.stringify(s));
        } catch {
            /* storage unavailable: stays signed in for this visit only */
        }
        setSaved(s);
    }, []);

    useEffect(() => {
        // Arriving from an emailed sign-in link: trade its one-time code for a session, then drop it from the address bar.
        const code = new URLSearchParams(window.location.search).get("code");
        if (!code) {
            setSaved(readSession());
            setChecking(false);
            return;
        }
        window.history.replaceState(null, "", window.location.pathname);
        fetch(`${apilink}/admin/login-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        })
            .then(async (res) => {
                const json = await res.json().catch(() => null);
                if (!res.ok) throw new Error(json?.message ?? "Couldn't sign in.");
                signedIn(json);
            })
            .catch((error) => {
                toastError(error.message);
                setSaved(readSession());
            })
            .finally(() => setChecking(false));
    }, [signedIn]);

    const session = useMemo<AdminSession | null>(
        () =>
            saved
                ? {
                      token: saved.token,
                      name: saved.name,
                      signOut() {
                          try {
                              localStorage.removeItem(TOKEN_KEY);
                          } catch {
                              /* storage unavailable */
                          }
                          setSaved(null);
                      },
                  }
                : null,
        [saved]
    );

    if (checking) return <Shell>Loading...</Shell>;
    if (!session)
        return (
            <Shell>
                <SignIn onSignedIn={signedIn} />
            </Shell>
        );

    return (
        <Shell wide>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="h-display text-3xl">Bookings</h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-fog">Signed in as {session.name}</span>
                    <button type="button" className="btn-ghost !px-4 !py-2" onClick={session.signOut}>
                        <MdLogout aria-hidden /> Sign out
                    </button>
                </div>
            </div>
            <nav className="mt-6 flex gap-2 overflow-x-auto" aria-label="Admin sections">
                {(
                    [
                        ["bookings", "Bookings"],
                        ["add", "Add a booking"],
                        ["settings", "Hours & time off"],
                        ["team", "Team & calendars"],
                    ] as const
                ).map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTab(key)}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                            tab === key ? "bg-white/10 text-white" : "text-fog hover:text-white"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </nav>
            <div className="mt-6">
                {tab === "bookings" && <BookingList session={session} />}
                {tab === "add" && <AddBooking session={session} onAdded={() => setTab("bookings")} />}
                {tab === "settings" && <Settings session={session} />}
                {tab === "team" && <Team session={session} />}
            </div>
        </Shell>
    );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
    return (
        <section className="pb-8 pt-28 lg:pt-32">
            <div className={`wrap ${wide ? "" : "max-w-md"}`}>{children}</div>
        </section>
    );
}

// Managers get a one-time link by email. The owner can still use the password.
function SignIn({ onSignedIn }: { onSignedIn(session: SavedSession): void }) {
    const [mode, setMode] = useState<"link" | "password">("link");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [sentTo, setSentTo] = useState("");
    const [busy, setBusy] = useState(false);
    const [captcha, setCaptcha] = useState<string | null>(null);
    const turnstile = useRef<TurnstileHandle>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!captcha) return toastError("Please wait a moment for the spam check to finish.");
        setBusy(true);
        try {
            const res = await fetch(`${apilink}/admin/${mode === "link" ? "login-link" : "login"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mode === "link" ? { email, turnstile_token: captcha } : { password, turnstile_token: captcha }),
            });
            const json = await res.json().catch(() => null);
            // Each spam check token works once.
            turnstile.current?.reset();
            setCaptcha(null);
            if (!res.ok) return toastError(json?.message ?? "Couldn't sign in.");
            if (mode === "link") setSentTo(email.trim());
            else onSignedIn(json);
        } catch {
            toastError("Couldn't sign in. Check your connection.");
            turnstile.current?.reset();
        } finally {
            setBusy(false);
        }
    };

    if (sentTo)
        return (
            <div className="card grid gap-4 p-8">
                <h1 className="h-display text-2xl">Check your email</h1>
                <p className="text-fog">
                    If <span className="text-white">{sentTo}</span> is a manager on the team, a sign-in link is on its way. It works
                    once, for the next 20 minutes. Check spam if it doesn't show up in a minute or two.
                </p>
                <button type="button" className="btn-ghost w-fit !px-4 !py-2" onClick={() => setSentTo("")}>
                    Use a different email
                </button>
            </div>
        );

    return (
        <form onSubmit={submit} className="card grid gap-4 p-8">
            <h1 className="h-display text-2xl">Sign in</h1>
            {mode === "link" ? (
                <label className="grid gap-2 text-sm font-semibold text-white/85">
                    Your email
                    <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                    <span className="text-xs font-normal text-fog">We'll email you a link to sign in. No password needed.</span>
                </label>
            ) : (
                <>
                    {/* Lets password managers file the password under the right account. */}
                    <input type="hidden" name="username" autoComplete="username" value={SITE.email} readOnly />
                    <label className="grid gap-2 text-sm font-semibold text-white/85">
                        Owner password
                        <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={field}
                        />
                    </label>
                </>
            )}
            <Turnstile
                ref={turnstile}
                siteKey={SITE.turnstileSiteKey}
                action="admin-login"
                onToken={setCaptcha}
                onError={() => toastError("The spam check couldn't load. Refresh the page.")}
            />
            <button type="submit" className="btn-gold" disabled={busy || (mode === "link" ? !email : !password)}>
                {busy ? "One moment..." : mode === "link" ? "Email me a sign-in link" : "Sign in"}
            </button>
            <button
                type="button"
                className="text-sm font-semibold text-fog hover:text-white"
                onClick={() => setMode(mode === "link" ? "password" : "link")}
            >
                {mode === "link" ? "Owner? Sign in with the password" : "Manager? Sign in with your email"}
            </button>
        </form>
    );
}

// ---- Bookings ------------------------------------------------------------------------------------------------

const FILTERS = {
    upcoming: { label: "Upcoming", query: () => `from=${today()}&status=confirmed` },
    past: { label: "Past", query: () => `from=${addDays(today(), -120)}&to=${addDays(today(), -1)}&status=confirmed` },
    cancelled: { label: "Cancelled", query: () => `from=${addDays(today(), -120)}&status=cancelled` },
} as const;

function BookingList({ session }: { session: AdminSession }) {
    const api = useApi(session);
    const [filter, setFilter] = useState<keyof typeof FILTERS>("upcoming");
    const [bookings, setBookings] = useState<Booking[] | null>(null);

    const load = useCallback(() => {
        setBookings(null);
        api<{ bookings: Booking[] }>(`/admin/bookings?${FILTERS[filter].query()}`)
            .then(({ bookings }) => setBookings(filter === "past" ? bookings.reverse() : bookings))
            .catch((error) => {
                toastError(error.message);
                setBookings([]);
            });
    }, [api, filter]);

    useEffect(load, [load]);

    const byDate = useMemo(() => {
        const groups = new Map<string, Booking[]>();
        for (const b of bookings ?? []) {
            const key = nyParts(b.starts_at).date;
            groups.set(key, [...(groups.get(key) ?? []), b]);
        }
        return [...groups.entries()];
    }, [bookings]);

    const replace = (updated: Booking) => setBookings((list) => list?.map((b) => (b.id === updated.id ? updated : b)) ?? null);

    return (
        <div>
            <div className="flex flex-wrap gap-2">
                {Object.entries(FILTERS).map(([key, f]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key as keyof typeof FILTERS)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                            filter === key ? "border-gold/60 text-gold" : "border-line text-fog hover:text-white"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
            {bookings === null ? (
                <p className="mt-6 text-fog">Loading...</p>
            ) : !bookings.length ? (
                <p className="mt-6 text-fog">No bookings here.</p>
            ) : (
                <div className="mt-6 grid gap-8">
                    {byDate.map(([date, list]) => (
                        <section key={date}>
                            <h2 className="font-display text-base font-semibold text-white">{formatDate(date)}</h2>
                            <div className="mt-3 grid gap-3">
                                {list.map((b) => (
                                    <BookingCard key={b.id} booking={b} session={session} onChange={replace} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

function BookingCard({ booking: b, session, onChange }: { booking: Booking; session: AdminSession; onChange(b: Booking): void }) {
    const api = useApi(session);
    const [editing, setEditing] = useState(false);
    const start = nyParts(b.starts_at);
    const end = nyParts(b.ends_at);
    const [form, setForm] = useState({
        date: start.date,
        time: start.time,
        paid: String(b.paid_cents / 100),
        total: String(b.total_cents / 100),
        admin_notes: b.admin_notes,
    });

    const patch = async (body: Record<string, unknown>, message: string) => {
        try {
            const { booking } = await api<{ booking: Booking }>(`/admin/bookings/${b.id}`, {
                method: "PATCH",
                body: JSON.stringify(body),
            });
            onChange(booking);
            toastSuccess(message);
            setEditing(false);
        } catch (error) {
            toastError((error as Error).message);
        }
    };

    const due = b.total_cents - b.paid_cents;
    const badge =
        b.status === "confirmed"
            ? "bg-emerald-500/15 text-emerald-300"
            : b.status === "pending"
            ? "bg-amber-500/15 text-amber-300"
            : "bg-white/10 text-fog";

    return (
        <article className={`card p-5 ${b.status === "cancelled" ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-display text-lg font-semibold text-white">
                        {formatTime(start.time)} – {formatTime(end.time)} · {b.package_name}
                    </p>
                    <p className="mt-1 text-white/90">{b.customer_name}</p>
                </div>
                <div className="flex items-center gap-2">
                    {b.source !== "website" && (
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase text-fog">{b.source}</span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${badge}`}>
                        {b.status === "pending" ? "awaiting payment" : b.status}
                    </span>
                </div>
            </div>
            <div className="mt-3 grid gap-1.5 text-sm text-fog sm:grid-cols-2">
                {b.customer_phone && (
                    <a href={`tel:${b.customer_phone}`} className="flex items-center gap-2 hover:text-white">
                        <MdPhone className="text-gold" aria-hidden /> {b.customer_phone}
                    </a>
                )}
                {b.customer_email && (
                    <a href={`mailto:${b.customer_email}`} className="truncate hover:text-white">
                        {b.customer_email}
                    </a>
                )}
                {b.address && (
                    <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(b.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-white sm:col-span-2"
                    >
                        <MdPlace className="shrink-0 text-gold" aria-hidden /> {b.address}
                    </a>
                )}
            </div>
            {b.add_ons.length > 0 && (
                <p className="mt-3 text-sm text-white/85">
                    <span className="text-fog">Add-ons: </span>
                    {b.add_ons.map((a) => (a.qty > 1 ? `${a.name} × ${a.qty}` : a.name)).join(", ")}
                </p>
            )}
            {b.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-white/85"><span className="text-fog">Customer notes: </span>{b.notes}</p>}
            {b.admin_notes && <p className="mt-2 whitespace-pre-wrap text-sm text-gold-soft"><span className="text-fog">Team notes: </span>{b.admin_notes}</p>}
            <p className="mt-3 text-sm">
                <span className="text-fog">Total</span> <span className="text-white">{money(b.total_cents)}</span>
                <span className="mx-2 text-line">|</span>
                <span className="text-fog">Paid</span> <span className="text-white">{money(b.paid_cents)}</span>
                <span className="mx-2 text-line">|</span>
                <span className="text-fog">Due</span> <span className="font-semibold text-gold">{money(due)}</span>
            </p>

            {editing ? (
                <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-4">
                    <label className="grid gap-1 text-xs font-semibold text-fog">
                        Date
                        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`${small} [color-scheme:dark]`} />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-fog">
                        Start
                        <input type="time" step={900} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={`${small} [color-scheme:dark]`} />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-fog">
                        Total ($)
                        <input inputMode="decimal" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} className={small} />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-fog">
                        Paid ($)
                        <input inputMode="decimal" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} className={small} />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-fog sm:col-span-4">
                        Team notes (in the team's calendars, never shown to the customer)
                        <textarea rows={2} value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} className={small} />
                    </label>
                    <div className="flex flex-wrap gap-2 sm:col-span-4">
                        <button
                            type="button"
                            className="btn-gold !px-4 !py-2"
                            onClick={() => {
                                const body: Record<string, unknown> = {
                                    admin_notes: form.admin_notes,
                                    paid: Number(form.paid),
                                    total: Number(form.total),
                                };
                                if (form.date !== start.date || form.time !== start.time) Object.assign(body, { date: form.date, time: form.time });
                                patch(body, "Booking updated.");
                            }}
                        >
                            Save
                        </button>
                        <button type="button" className="btn-ghost !px-4 !py-2" onClick={() => setEditing(false)}>
                            Close
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className="btn-ghost !px-4 !py-2" onClick={() => setEditing(true)}>
                        Edit / reschedule
                    </button>
                    {b.status === "cancelled" ? (
                        <button type="button" className="btn-ghost !px-4 !py-2" onClick={() => patch({ status: "confirmed" }, "Booking restored.")}>
                            Restore
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn-ghost !px-4 !py-2 hover:!border-red-400/60 hover:!text-red-300"
                            onClick={() => {
                                if (window.confirm(`Cancel ${b.customer_name}'s booking? This frees the time slot. Refunds are done in Stripe.`))
                                    patch({ status: "cancelled" }, "Booking cancelled.");
                            }}
                        >
                            Cancel booking
                        </button>
                    )}
                    {b.stripe_payment_intent && (
                        <a
                            href={`https://dashboard.stripe.com/payments/${b.stripe_payment_intent}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost !px-4 !py-2"
                        >
                            Payment in Stripe <MdOpenInNew aria-hidden />
                        </a>
                    )}
                </div>
            )}
        </article>
    );
}

// ---- Manual booking ------------------------------------------------------------------------------------------

function AddBooking({ session, onAdded }: { session: AdminSession; onAdded(): void }) {
    const api = useApi(session);
    const [form, setForm] = useState({
        package: PARTY_PACKAGES[0].id,
        package_name: "",
        minutes: "120",
        date: "",
        time: "13:00",
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        admin_notes: "",
        total: "",
        paid: "0",
    });
    const [addOns, setAddOns] = useState<AddOnChoice[]>([]);
    const [busy, setBusy] = useState(false);
    const custom = form.package === "custom";
    const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api("/admin/bookings", {
                method: "POST",
                body: JSON.stringify({ ...form, addOns: custom ? [] : addOns }),
            });
            toastSuccess("Booking added.");
            onAdded();
        } catch (error) {
            toastError((error as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={save} className="card grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <p className="text-sm text-fog sm:col-span-2">
                For phone bookings, school and corporate events, or anything booked outside the website. These block the time
                slot online right away. No emails are sent.
            </p>
            <label className="grid gap-2 text-sm font-semibold text-white/85">
                Party
                <select value={form.package} onChange={(e) => set({ package: e.target.value })} className={field}>
                    {PARTY_PACKAGES.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name} ({formatPrice(p.price)})
                        </option>
                    ))}
                    <option value="custom">Custom event (school, corporate, block party...)</option>
                </select>
            </label>
            {custom ? (
                <div className="grid grid-cols-[1fr_110px] gap-3">
                    <label className="grid gap-2 text-sm font-semibold text-white/85">
                        Event name
                        <input required value={form.package_name} onChange={(e) => set({ package_name: e.target.value })} className={field} />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-white/85">
                        Minutes
                        <input required inputMode="numeric" value={form.minutes} onChange={(e) => set({ minutes: e.target.value })} className={field} />
                    </label>
                </div>
            ) : (
                <div />
            )}
            <label className="grid gap-2 text-sm font-semibold text-white/85">
                Date
                <input required type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} className={`${field} [color-scheme:dark]`} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white/85">
                Start time
                <input required type="time" step={900} value={form.time} onChange={(e) => set({ time: e.target.value })} className={`${field} [color-scheme:dark]`} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white/85">
                Customer name
                <input required value={form.name} onChange={(e) => set({ name: e.target.value })} className={field} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white/85">
                Phone
                <input type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} className={field} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white/85">
                Email
                <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} className={field} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white/85">
                Address
                <input value={form.address} onChange={(e) => set({ address: e.target.value })} className={field} />
            </label>
            {!custom && (
                <fieldset className="sm:col-span-2">
                    <legend className="text-sm font-semibold text-white/85">Add-ons</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {BOOKABLE_ADD_ON_GROUPS.flatMap((g) => g.items).map((item) => {
                            const choice = addOns.find((a) => a.id === item.id);
                            return (
                                <span key={item.id} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${choice ? "border-gold/60 text-gold" : "border-line text-fog"}`}>
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={!!choice}
                                            onChange={(e) =>
                                                setAddOns((list) =>
                                                    e.target.checked ? [...list, { id: item.id, qty: item.perChild ? 10 : 1 }] : list.filter((a) => a.id !== item.id)
                                                )
                                            }
                                            className="accent-[#ffb02e]"
                                        />
                                        {item.name}
                                    </label>
                                    {choice && (item.perChild || item.minutes) && (
                                        <input
                                            inputMode="numeric"
                                            aria-label={`${item.name} quantity`}
                                            value={choice.qty}
                                            onChange={(e) =>
                                                setAddOns((list) => list.map((a) => (a.id === item.id ? { ...a, qty: Number(e.target.value) || 1 } : a)))
                                            }
                                            className="w-10 rounded bg-ink/60 px-1 text-center text-white"
                                        />
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </fieldset>
            )}
            <label className="grid gap-2 text-sm font-semibold text-white/85">
                Total ($){!custom && <span className="text-xs font-normal text-fog">Leave blank to use package + add-on prices</span>}
                <input inputMode="decimal" value={form.total} onChange={(e) => set({ total: e.target.value })} className={field} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white/85">
                Already paid ($)
                <input inputMode="decimal" value={form.paid} onChange={(e) => set({ paid: e.target.value })} className={field} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white/85 sm:col-span-2">
                Team notes
                <span className="text-xs font-normal text-fog">Shown in the team's calendars, never to the customer.</span>
                <textarea rows={2} value={form.admin_notes} onChange={(e) => set({ admin_notes: e.target.value })} className={field} />
            </label>
            <button type="submit" className="btn-gold sm:col-span-2 sm:w-fit" disabled={busy}>
                {busy ? "Saving..." : "Add booking"}
            </button>
        </form>
    );
}

// ---- Settings ------------------------------------------------------------------------------------------------

function Settings({ session }: { session: AdminSession }) {
    const api = useApi(session);
    const [settings, setSettings] = useState<BookingSettings | null>(null);
    const [blocked, setBlocked] = useState<Blocked[]>([]);
    const [newBlock, setNewBlock] = useState({ start_date: "", end_date: "", reason: "" });

    useEffect(() => {
        api<{ settings: BookingSettings; blocked: Blocked[] }>("/admin/settings")
            .then((data) => {
                setSettings(data.settings);
                setBlocked(data.blocked);
            })
            .catch((error) => toastError(error.message));
    }, [api]);

    if (!settings) return <p className="text-fog">Loading...</p>;

    const setDay = (i: number, value: BookingSettings["weekly_hours"][number]) =>
        setSettings({ ...settings, weekly_hours: settings.weekly_hours.map((h, j) => (j === i ? value : h)) });

    const save = async () => {
        try {
            const { settings: saved } = await api<{ settings: BookingSettings }>("/admin/settings", {
                method: "PUT",
                body: JSON.stringify(settings),
            });
            setSettings(saved);
            toastSuccess("Hours saved.");
        } catch (error) {
            toastError((error as Error).message);
        }
    };

    const addBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { blocked: row } = await api<{ blocked: Blocked }>("/admin/blocked", {
                method: "POST",
                body: JSON.stringify(newBlock),
            });
            setBlocked((list) => [...list, row].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
            setNewBlock({ start_date: "", end_date: "", reason: "" });
            toastSuccess("Time off added.");
        } catch (error) {
            toastError((error as Error).message);
        }
    };

    const removeBlock = async (id: string) => {
        try {
            await api(`/admin/blocked/${id}`, { method: "DELETE" });
            setBlocked((list) => list.filter((b) => b.id !== id));
        } catch (error) {
            toastError((error as Error).message);
        }
    };

    const number = (
        key: "buffer_minutes" | "min_notice_hours" | "max_advance_days" | "slot_step_minutes" | "capacity",
        label: string,
        hint: string
    ) => (
        <label className="grid gap-1 text-sm font-semibold text-white/85">
            {label}
            <input
                inputMode="numeric"
                value={settings[key]}
                onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value.replace(/\D/g, "")) })}
                className={small}
            />
            <span className="text-xs font-normal text-fog">{hint}</span>
        </label>
    );

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold text-white">Bookable hours</h2>
                <p className="mt-1 text-sm text-fog">Earliest start and latest finish for online bookings, in New York time.</p>
                <div className="mt-5 grid gap-3">
                    {settings.weekly_hours.map((h, i) => (
                        <div key={DAY_NAMES[i]} className="grid grid-cols-[110px_1fr] items-center gap-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-white/90">
                                <input
                                    type="checkbox"
                                    checked={!!h}
                                    onChange={(e) => setDay(i, e.target.checked ? { open: "12:00", close: "21:00" } : null)}
                                    className="accent-[#ffb02e]"
                                />
                                {DAY_NAMES[i]}
                            </label>
                            {h ? (
                                <div className="flex items-center gap-2">
                                    <input type="time" step={900} value={h.open} onChange={(e) => setDay(i, { ...h, open: e.target.value })} className={`${small} [color-scheme:dark]`} aria-label={`${DAY_NAMES[i]} opens`} />
                                    <span className="text-fog">to</span>
                                    <input type="time" step={900} value={h.close} onChange={(e) => setDay(i, { ...h, close: e.target.value })} className={`${small} [color-scheme:dark]`} aria-label={`${DAY_NAMES[i]} closes`} />
                                </div>
                            ) : (
                                <span className="text-sm text-fog">Closed</span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {number("buffer_minutes", "Gap between parties (min)", "Travel, setup and pack-up time.")}
                    {number("min_notice_hours", "Minimum notice (hours)", "Sooner than this, customers must call.")}
                    {number("max_advance_days", "Book up to (days ahead)", "How far out the calendar opens.")}
                    {number("slot_step_minutes", "Start times every (min)", "30 offers 1:00, 1:30, 2:00...")}
                    {number("capacity", "Parties at the same time", "1 unless a second crew and truck can run a party.")}
                </div>
                <button type="button" className="btn-gold mt-6" onClick={save}>
                    Save hours
                </button>
            </section>

            <div className="grid content-start gap-6">
                <section className="card p-6 sm:p-8">
                    <h2 className="font-display text-lg font-semibold text-white">Time off</h2>
                    <p className="mt-1 text-sm text-fog">Whole days nobody can book online.</p>
                    <form onSubmit={addBlock} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr]">
                        <label className="grid gap-1 text-xs font-semibold text-fog">
                            From
                            <input required type="date" value={newBlock.start_date} onChange={(e) => setNewBlock({ ...newBlock, start_date: e.target.value })} className={`${small} [color-scheme:dark]`} />
                        </label>
                        <label className="grid gap-1 text-xs font-semibold text-fog">
                            Through
                            <input type="date" value={newBlock.end_date} onChange={(e) => setNewBlock({ ...newBlock, end_date: e.target.value })} className={`${small} [color-scheme:dark]`} />
                        </label>
                        <label className="grid gap-1 text-xs font-semibold text-fog sm:col-span-2">
                            Reason (only the dashboard shows this)
                            <input value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })} className={small} />
                        </label>
                        <button type="submit" className="btn-ghost w-fit !px-4 !py-2">
                            Block these days
                        </button>
                    </form>
                    {blocked.length > 0 && (
                        <ul className="mt-5 divide-y divide-line text-sm">
                            {blocked.map((b) => {
                                const from = nyParts(b.starts_at).date;
                                const through = addDays(nyParts(b.ends_at).date, -1);
                                return (
                                    <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                                        <span className="text-white/90">
                                            {formatDate(from, { weekday: "short" })}
                                            {through !== from && ` – ${formatDate(through, { weekday: "short" })}`}
                                            {b.reason && <span className="block text-xs text-fog">{b.reason}</span>}
                                        </span>
                                        <button type="button" className="text-xs font-semibold text-fog hover:text-red-300" onClick={() => removeBlock(b.id)}>
                                            Remove
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

// ---- Team & calendars ----------------------------------------------------------------------------------------

const tokenOf = (calendarUrl: string) => new URL(calendarUrl).searchParams.get("token") ?? "";

// Ways to get someone's calendar link onto their phone: a text with the /calendar page link, or the buttons directly.
function CalendarLinks({ calendarUrl, name }: { calendarUrl: string; name: string }) {
    const token = tokenOf(calendarUrl);
    const page = subscribePageUrl(token);
    const links = calendarLinks(token);
    const message = `Hi ${name.split(" ")[0]}, here's your Prestigious Gaming bookings calendar. Open it to add every party to your Apple or Google Calendar: ${page}`;
    return (
        <div className="flex flex-wrap gap-2">
            <a href={`sms:?&body=${encodeURIComponent(message)}`} className="btn-ghost !px-3 !py-1.5 !text-xs">
                <MdSms aria-hidden /> Text link
            </a>
            <button
                type="button"
                className="btn-ghost !px-3 !py-1.5 !text-xs"
                onClick={() => navigator.clipboard.writeText(page).then(() => toastSuccess("Link copied. Paste it into a text or email."))}
            >
                <MdContentCopy aria-hidden /> Copy link
            </button>
            <a href={links.apple} className="btn-ghost !px-3 !py-1.5 !text-xs">
                Apple Calendar
            </a>
            <a href={links.google} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-3 !py-1.5 !text-xs">
                Google Calendar <MdOpenInNew aria-hidden />
            </a>
        </div>
    );
}

function Team({ session }: { session: AdminSession }) {
    const api = useApi(session);
    const [data, setData] = useState<{ me: string; staff: Member[]; ownerCalendarUrl: string } | null>(null);
    const [form, setForm] = useState({ name: "", email: "", role: "worker" as Member["role"] });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api<{ me: string; staff: Member[]; ownerCalendarUrl: string }>("/admin/staff")
            .then(setData)
            .catch((error) => toastError(error.message));
    }, [api]);

    if (!data) return <p className="text-fog">Loading...</p>;

    const replace = (member: Member) =>
        setData((d) => d && { ...d, staff: d.staff.map((m) => (m.id === member.id ? member : m)) });

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { member } = await api<{ member: Member }>("/admin/staff", { method: "POST", body: JSON.stringify(form) });
            setData((d) => d && { ...d, staff: [...d.staff, member] });
            setForm({ name: "", email: "", role: "worker" });
            toastSuccess(`${member.name} added. Send them their calendar link below.`);
        } catch (error) {
            toastError((error as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const update = async (m: Member, body: Record<string, unknown>, message: string) => {
        try {
            const { member } = await api<{ member: Member }>(`/admin/staff/${m.id}`, { method: "PATCH", body: JSON.stringify(body) });
            replace(member);
            toastSuccess(message);
        } catch (error) {
            toastError((error as Error).message);
        }
    };

    const remove = async (m: Member) => {
        if (!window.confirm(`Remove ${m.name}? Their calendar link stops working${m.role === "manager" ? " and they're signed out" : ""}.`)) return;
        try {
            await api(`/admin/staff/${m.id}`, { method: "DELETE" });
            setData((d) => d && { ...d, staff: d.staff.filter((s) => s.id !== m.id) });
        } catch (error) {
            toastError((error as Error).message);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="grid content-start gap-6">
                {/* Managers find their own link in the team list. */}
                {data.me === "owner" && (
                    <section className="card p-6 sm:p-8">
                        <h2 className="font-display text-lg font-semibold text-white">Your calendar</h2>
                        <p className="mt-1 text-sm text-fog">
                            Add every confirmed party to your own Apple or Google Calendar. On an iPhone, tap Apple Calendar.
                            Google only adds calendar links from a computer.
                        </p>
                        <div className="mt-4">
                            <CalendarLinks calendarUrl={data.ownerCalendarUrl} name={session.name} />
                        </div>
                    </section>
                )}
                <form onSubmit={add} className="card grid gap-4 p-6 sm:p-8">
                    <h2 className="font-display text-lg font-semibold text-white">Add someone</h2>
                    <label className="grid gap-1 text-sm font-semibold text-white/85">
                        Name
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={small} />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-white/85">
                        Email {form.role === "worker" && <span className="text-xs font-normal text-fog">(optional for workers)</span>}
                        <input
                            type="email"
                            required={form.role === "manager"}
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className={small}
                        />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-white/85">
                        Access
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Member["role"] })} className={small}>
                            <option value="worker">Worker: sees bookings in their calendar</option>
                            <option value="manager">Manager: can also sign in here and change bookings, hours and the team</option>
                        </select>
                    </label>
                    <button type="submit" className="btn-gold w-fit !px-4 !py-2" disabled={busy}>
                        {busy ? "Adding..." : "Add to team"}
                    </button>
                </form>
            </div>

            <section className="card p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold text-white">Team</h2>
                <p className="mt-1 text-sm text-fog">
                    Everyone gets their own calendar link with every confirmed party: time, address, customer phone, add-ons,
                    what's due and team notes. Text it to them and they tap to add it. Managers sign in at{" "}
                    <span className="text-white">{SITE.url.replace("https://", "")}/admin</span> with their email: no password.
                </p>
                {!data.staff.length ? (
                    <p className="mt-6 text-fog">No one added yet.</p>
                ) : (
                    <ul className="mt-6 grid gap-4">
                        {data.staff.map((m) => (
                            <li key={m.id} className="rounded-2xl border border-line p-4">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-white">
                                            {m.name}
                                            {m.id === data.me && <span className="text-fog"> (you)</span>}
                                        </p>
                                        {m.email && <p className="text-sm text-fog">{m.email}</p>}
                                        {m.role === "manager" && (
                                            <p className="text-xs text-fog">
                                                {m.last_login_at ? `Last signed in ${new Date(m.last_login_at).toLocaleDateString("en-US", { timeZone: TIME_ZONE })}` : "Hasn't signed in yet"}
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${
                                            m.role === "manager" ? "bg-gold/15 text-gold" : "bg-white/10 text-fog"
                                        }`}
                                    >
                                        {m.role}
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <CalendarLinks calendarUrl={m.calendarUrl} name={m.name} />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-fog">
                                    {m.id !== data.me &&
                                        (m.role === "worker" ? (
                                            <button
                                                type="button"
                                                className="hover:text-white"
                                                onClick={() => {
                                                    if (!m.email) return toastError(`Add an email for ${m.name} first: managers sign in with it.`);
                                                    update(m, { ...m, role: "manager" }, `${m.name} can now sign in.`);
                                                }}
                                            >
                                                Make manager
                                            </button>
                                        ) : (
                                            <button type="button" className="hover:text-white" onClick={() => update(m, { ...m, role: "worker" }, `${m.name} is now a worker.`)}>
                                                Make worker
                                            </button>
                                        ))}
                                    <button
                                        type="button"
                                        className="hover:text-white"
                                        onClick={() => {
                                            const email = window.prompt(`Email for ${m.name}`, m.email);
                                            if (email !== null) update(m, { ...m, email }, "Email saved.");
                                        }}
                                    >
                                        {m.email ? "Change email" : "Add email"}
                                    </button>
                                    <button
                                        type="button"
                                        className="hover:text-white"
                                        onClick={() => {
                                            if (window.confirm(`Make a new calendar link for ${m.name}? Their old link stops working, so they'll need to add the new one.`))
                                                update(m, { new_calendar_link: true }, "New link ready. Send it to them.");
                                        }}
                                    >
                                        New calendar link
                                    </button>
                                    {m.id !== data.me && (
                                        <button type="button" className="hover:text-red-300" onClick={() => remove(m)}>
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

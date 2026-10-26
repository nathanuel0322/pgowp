import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdContentCopy, MdLogout, MdOpenInNew, MdPhone, MdPlace } from "react-icons/md";
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
import { SITE } from "../site";

// Owner dashboard: bookings, manual bookings, hours and time off. Signs in with the ADMIN_PASSWORD set on Pages; the
// worker checks the signed session token on every request.

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

// Signed session token from POST /api/admin/login. signOut is called on any 401 so an expired session lands back on
// the sign-in form.
interface AdminSession {
    token: string;
    signOut(): void;
}

function readToken() {
    try {
        const saved = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "null");
        return saved && saved.expires > Date.now() ? (saved.token as string) : null;
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
    const [token, setToken] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);
    const [tab, setTab] = useState<"bookings" | "add" | "settings">("bookings");

    useEffect(() => {
        setToken(readToken());
        setChecking(false);
    }, []);

    const session = useMemo<AdminSession | null>(
        () =>
            token
                ? {
                      token,
                      signOut() {
                          try {
                              localStorage.removeItem(TOKEN_KEY);
                          } catch {
                              /* storage unavailable */
                          }
                          setToken(null);
                      },
                  }
                : null,
        [token]
    );

    if (checking) return <Shell>Loading...</Shell>;
    if (!session)
        return (
            <Shell>
                <SignIn
                    onSignedIn={(t, expires) => {
                        try {
                            localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: t, expires }));
                        } catch {
                            /* storage unavailable: stays signed in for this visit only */
                        }
                        setToken(t);
                    }}
                />
            </Shell>
        );

    return (
        <Shell wide>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="h-display text-3xl">Bookings</h1>
                <button type="button" className="btn-ghost !px-4 !py-2" onClick={session.signOut}>
                    <MdLogout aria-hidden /> Sign out
                </button>
            </div>
            <nav className="mt-6 flex gap-2 overflow-x-auto" aria-label="Admin sections">
                {(
                    [
                        ["bookings", "Bookings"],
                        ["add", "Add a booking"],
                        ["settings", "Hours & time off"],
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

function SignIn({ onSignedIn }: { onSignedIn(token: string, expires: number): void }) {
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [captcha, setCaptcha] = useState<string | null>(null);
    const turnstile = useRef<TurnstileHandle>(null);

    const signIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!captcha) return toastError("Please wait a moment for the spam check to finish.");
        setBusy(true);
        try {
            const res = await fetch(`${apilink}/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, turnstile_token: captcha }),
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                toastError(json?.message ?? "Couldn't sign in.");
                turnstile.current?.reset();
                return;
            }
            onSignedIn(json.token, json.expires);
        } catch {
            toastError("Couldn't sign in. Check your connection.");
            turnstile.current?.reset();
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={signIn} className="card grid gap-4 p-8">
            <h1 className="h-display text-2xl">Owner sign in</h1>
            {/* Lets password managers file the password under the right account. */}
            <input type="hidden" name="username" autoComplete="username" value={SITE.email} readOnly />
            <label className="grid gap-2 text-sm font-semibold text-white/85">
                Password
                <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={field}
                />
            </label>
            <Turnstile
                ref={turnstile}
                siteKey={SITE.turnstileSiteKey}
                action="admin-login"
                onToken={setCaptcha}
                onError={() => toastError("The spam check couldn't load. Refresh the page.")}
            />
            <button type="submit" className="btn-gold" disabled={busy || !password}>
                {busy ? "Signing in..." : "Sign in"}
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
            {b.admin_notes && <p className="mt-2 whitespace-pre-wrap text-sm text-gold-soft"><span className="text-fog">Your notes: </span>{b.admin_notes}</p>}
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
                        Your notes (only you see these)
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
                Your notes
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
    const [calendarUrl, setCalendarUrl] = useState("");
    const [newBlock, setNewBlock] = useState({ start_date: "", end_date: "", reason: "" });

    useEffect(() => {
        api<{ settings: BookingSettings; blocked: Blocked[]; calendarUrl: string }>("/admin/settings")
            .then((data) => {
                setSettings(data.settings);
                setBlocked(data.blocked);
                setCalendarUrl(data.calendarUrl);
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
                            Reason (only you see this)
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

                <section className="card p-6 sm:p-8">
                    <h2 className="font-display text-lg font-semibold text-white">Calendar feed</h2>
                    <p className="mt-1 text-sm text-fog">
                        Subscribe to this link in Google Calendar (Other calendars → From URL) or on your iPhone (Settings →
                        Calendar → Accounts → Add Subscribed Calendar). Confirmed bookings show up automatically. Keep the link
                        private: anyone with it can see your bookings.
                    </p>
                    <div className="mt-4 flex gap-2">
                        <input readOnly value={calendarUrl} className={`${small} font-mono text-xs`} onFocus={(e) => e.target.select()} />
                        <button
                            type="button"
                            className="btn-ghost shrink-0 !px-3"
                            aria-label="Copy calendar link"
                            onClick={() => navigator.clipboard.writeText(calendarUrl).then(() => toastSuccess("Copied."))}
                        >
                            <MdContentCopy />
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

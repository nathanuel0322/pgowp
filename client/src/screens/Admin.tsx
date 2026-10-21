import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdContentCopy, MdLocationOn, MdLogout, MdPhone, MdRefresh } from "react-icons/md";
import BookingForm, { adminField, BookingFormValues } from "../components/admin/BookingForm";
import Turnstile, { TurnstileHandle } from "../components/Turnstile";
import { BOOKABLE_ADD_ONS, findPackage } from "../booking/quote";
import type { BookingSettings } from "../booking/schedule";
import type { BlockRow, BookingRow } from "../booking/server";
import { formatDate, formatRange, formatTime, todayInZone, utcToZoned } from "../booking/time";
import { formatPrice } from "../data/packages";
import { apilink, toastError, toastSuccess } from "../GlobalFunctions";
import { SITE } from "../site";

class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public code?: string
    ) {
        super(message);
    }
}

// Signing in returns a token that's good for 30 days; it's kept in this browser so the page stays signed in.
const TOKEN_KEY = "pgow-admin-session";

function savedToken() {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        // The token starts with its expiry time.
        return token && Number(token.split(".")[0]) > Date.now() ? token : null;
    } catch {
        return null;
    }
}

function saveToken(token: string | null) {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {
        // Private browsing: stays signed in until the tab closes.
    }
}

// Set by the Admin page, so any request that comes back "please sign in" shows the sign-in form again.
let onSignedOut = () => {};

async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
    const res = await fetch(`${apilink}/admin${path}`, {
        method: init.method ?? "GET",
        headers: {
            Authorization: `Bearer ${savedToken() ?? ""}`,
            ...(init.body ? { "Content-Type": "application/json" } : {}),
        },
        body: init.body ? JSON.stringify(init.body) : undefined,
    });
    const body = res.status === 204 ? null : await res.json().catch(() => null);
    if (res.status === 401) onSignedOut();
    if (!res.ok) throw new ApiError(res.status, body?.message ?? "Something went wrong.", body?.code);
    return body as T;
}

interface AdminData {
    bookings: BookingRow[];
    blocks: BlockRow[];
    settings: BookingSettings;
    calendarUrl: string | null;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const STATUS_STYLES: Record<string, string> = {
    requested: "bg-gold text-ink",
    confirmed: "bg-emerald-500/15 text-emerald-300",
    declined: "bg-white/10 text-fog",
    cancelled: "bg-white/10 text-fog",
};
const STATUS_LABELS: Record<string, string> = {
    requested: "Needs approval",
    confirmed: "Confirmed",
    declined: "Declined",
    cancelled: "Cancelled",
};

export default function Admin() {
    // undefined until the saved sign-in has been checked, so the sign-in form doesn't flash.
    const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        setSignedIn(!!savedToken());
        onSignedOut = () => {
            saveToken(null);
            setSignedIn(false);
        };
    }, []);

    const signIn = (token: string) => {
        saveToken(token);
        setSignedIn(true);
    };

    return (
        <div className="min-h-screen bg-ink">
            <header className="border-b border-line bg-surface/80">
                <div className="wrap flex h-16 items-center justify-between gap-4">
                    <Link to="/" className="font-display text-sm font-semibold text-white">
                        PGOW Plus <span className="text-fog">· Bookings</span>
                    </Link>
                    {signedIn && (
                        <button
                            type="button"
                            onClick={() => onSignedOut()}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-fog hover:text-white"
                        >
                            <MdLogout size={16} /> Sign out
                        </button>
                    )}
                </div>
            </header>
            {signedIn === undefined ? null : signedIn ? <Dashboard /> : <SignIn onSignedIn={signIn} />}
        </div>
    );
}

function SignIn({ onSignedIn }: { onSignedIn(token: string): void }) {
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [human, setHuman] = useState<string | null>(null);
    const turnstile = useRef<TurnstileHandle>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!human) return toastError("Please wait a moment for the spam check to finish, then try again.");
        setBusy(true);
        try {
            const res = await fetch(`${apilink}/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, turnstileToken: human }),
            });
            const body = await res.json().catch(() => ({}));
            if (res.ok && body.token) return onSignedIn(body.token);
            toastError(body.message ?? "Couldn't sign in. Please try again.");
        } catch {
            toastError("Couldn't reach the website. Please check your connection and try again.");
        } finally {
            setBusy(false);
        }
        // Each spam-check token works only once.
        turnstile.current?.reset();
    };

    return (
        <form onSubmit={submit} className="wrap mt-16 max-w-sm!">
            <h1 className="font-display text-2xl font-semibold text-white">Sign in</h1>
            <p className="mt-2 text-sm text-fog">Manage party bookings, time off and hours.</p>
            {/* Lets password managers save the password under a name. */}
            <input type="text" name="username" autoComplete="username" value="PGOW Plus bookings" readOnly hidden />
            <label className="mt-6 block">
                <span className="text-sm font-semibold text-white">Password</span>
                <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${adminField} mt-1.5`}
                />
            </label>
            <div className="mt-4">
                <Turnstile
                    ref={turnstile}
                    siteKey={SITE.turnstileSiteKey}
                    action="admin"
                    onToken={setHuman}
                    onError={() => toastError("The spam check couldn't load. Please refresh the page.")}
                />
            </div>
            <button type="submit" className="btn-gold mt-4 w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
            </button>
            <p className="mt-4 text-center text-sm text-fog">Forgot the password? Whoever runs the website can set a new one.</p>
        </form>
    );
}

type Tab = "requests" | "upcoming" | "past" | "timeoff" | "settings";

function Dashboard() {
    const [data, setData] = useState<AdminData | null>(null);
    const [tab, setTab] = useState<Tab>("requests");
    const [editing, setEditing] = useState<BookingRow | "new" | null>(null);
    const [loading, setLoading] = useState(false);

    const firstLoad = useRef(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await api<AdminData>("/bookings");
            setData(result);
            // Open on the upcoming list when nothing is waiting for approval.
            if (firstLoad.current && !result.bookings.some((b) => b.status === "requested")) setTab("upcoming");
            firstLoad.current = false;
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Couldn't load bookings.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const now = Date.now();
    const bookings = data?.bookings ?? [];
    const live = (b: BookingRow) => b.status === "requested" || b.status === "confirmed";
    const lists = {
        requests: bookings.filter((b) => b.status === "requested"),
        upcoming: bookings.filter((b) => live(b) && Date.parse(b.end_at) >= now),
        past: bookings.filter((b) => !live(b) || Date.parse(b.end_at) < now).reverse(),
    };

    const replace = (b: BookingRow) =>
        setData((d) => d && { ...d, bookings: d.bookings.map((x) => (x.id === b.id ? b : x)) });

    const save = async (values: BookingFormValues, existing?: BookingRow) => {
        const send = (force: boolean) =>
            existing
                ? api<{ booking: BookingRow }>(`/bookings/${existing.id}`, { method: "PATCH", body: { ...values, action: "update", force } })
                : api<{ booking: BookingRow }>("/bookings", { method: "POST", body: { ...values, force } });
        try {
            let result;
            try {
                result = await send(false);
            } catch (error) {
                if (!(error instanceof ApiError && error.code === "conflict")) throw error;
                if (!window.confirm("This overlaps other parties or time off. Save it anyway?")) return;
                result = await send(true);
            }
            toastSuccess(existing ? "Booking updated" : "Booking added");
            setEditing(null);
            if (existing) replace(result.booking);
            else load();
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Couldn't save the booking.");
        }
    };

    const act = async (b: BookingRow, action: "confirm" | "decline" | "cancel") => {
        let body: Record<string, unknown> = { action };
        if (action === "confirm") {
            if (!window.confirm(`Confirm ${b.customer_name}'s party? They'll get a confirmation email.`)) return;
        } else if (action === "decline") {
            const message = window.prompt(
                `Decline ${b.customer_name}'s request? Their ${formatPrice(Number(b.paid))} deposit is refunded automatically.\n\nOptional note to include in the email:`,
                ""
            );
            if (message === null) return;
            body = { ...body, message };
        } else {
            if (!window.confirm(`Cancel ${b.customer_name}'s party?`)) return;
            const paid = Number(b.paid) - Number(b.refunded);
            const refund = paid > 0 && b.stripe_payment_intent ? window.confirm(`Refund their ${formatPrice(paid)} deposit? (Cancel = keep it)`) : false;
            const message = window.prompt("Optional note to include in the cancellation email:", "");
            if (message === null) return;
            body = { ...body, refund, message };
        }
        try {
            const { booking } = await api<{ booking: BookingRow }>(`/bookings/${b.id}`, { method: "PATCH", body });
            replace(booking);
            toastSuccess(action === "confirm" ? "Confirmed. The customer has been emailed." : action === "decline" ? "Declined and refunded" : "Cancelled");
        } catch (error) {
            toastError(error instanceof Error ? error.message : "That didn't work.");
        }
    };

    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: "requests", label: "Needs approval", count: lists.requests.length },
        { id: "upcoming", label: "Upcoming", count: lists.upcoming.length },
        { id: "past", label: "Past & cancelled" },
        { id: "timeoff", label: "Time off" },
        { id: "settings", label: "Hours & settings" },
    ];

    return (
        <div className="wrap py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-2xl font-semibold text-white">Bookings</h1>
                <div className="flex gap-2">
                    <button type="button" onClick={load} className="btn-ghost px-4!" disabled={loading} aria-label="Refresh">
                        <MdRefresh size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button type="button" onClick={() => setEditing("new")} className="btn-gold px-4!">
                        <MdAdd size={18} /> Add booking
                    </button>
                </div>
            </div>

            <nav className="-mx-4 mt-6 flex gap-1 overflow-x-auto px-4 pb-1" aria-label="Sections">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        aria-current={tab === t.id}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                            tab === t.id ? "bg-white/10 text-white" : "text-fog hover:text-white"
                        }`}
                    >
                        {t.label}
                        {t.count ? (
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${t.id === "requests" ? "bg-gold text-ink" : "bg-white/10"}`}>
                                {t.count}
                            </span>
                        ) : null}
                    </button>
                ))}
            </nav>

            <div className="mt-6">
                {!data ? (
                    <p className="text-fog">{loading ? "Loading…" : "Couldn't load bookings."}</p>
                ) : tab === "timeoff" ? (
                    <TimeOff blocks={data.blocks} onChange={load} />
                ) : tab === "settings" ? (
                    <Settings settings={data.settings} calendarUrl={data.calendarUrl} onSaved={(settings) => setData({ ...data, settings })} />
                ) : (
                    <BookingList
                        bookings={lists[tab]}
                        empty={
                            tab === "requests"
                                ? "No requests waiting. New online bookings show up here for you to confirm."
                                : tab === "upcoming"
                                  ? "No upcoming parties."
                                  : "Nothing here yet."
                        }
                        onAction={act}
                        onEdit={setEditing}
                    />
                )}
            </div>

            {editing && (
                <BookingForm
                    booking={editing === "new" ? undefined : editing}
                    onClose={() => setEditing(null)}
                    onSave={(values) => save(values, editing === "new" ? undefined : editing)}
                />
            )}
        </div>
    );
}

function BookingList({
    bookings,
    empty,
    onAction,
    onEdit,
}: {
    bookings: BookingRow[];
    empty: string;
    onAction(b: BookingRow, action: "confirm" | "decline" | "cancel"): void;
    onEdit(b: BookingRow): void;
}) {
    if (!bookings.length) return <p className="rounded-2xl border border-dashed border-line p-8 text-center text-fog">{empty}</p>;
    return (
        <ul className="space-y-4">
            {bookings.map((b) => {
                const pkg = findPackage(b.package_id);
                const due = Math.max(0, Number(b.total) - Number(b.paid) + Number(b.refunded));
                const live = b.status === "requested" || b.status === "confirmed";
                return (
                    <li key={b.id} className="card p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="font-display text-lg font-semibold text-white">{formatRange(Date.parse(b.start_at), Date.parse(b.end_at))}</p>
                                <p className="mt-1 text-sm text-white/85">
                                    {pkg?.name ?? b.package_id}
                                    {b.extra_hours ? ` + ${b.extra_hours} hr` : ""} · {b.guests} guests
                                    {b.source === "admin" ? <span className="text-fog"> · added by you</span> : null}
                                </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[b.status] ?? ""}`}>{STATUS_LABELS[b.status] ?? b.status}</span>
                        </div>

                        <div className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                            <p className="font-semibold text-white">
                                {b.customer_name}
                                {b.guest_of_honor ? <span className="font-normal text-fog"> · for {b.guest_of_honor}</span> : null}
                            </p>
                            {b.customer_phone && (
                                <a href={`tel:${b.customer_phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-gold hover:underline">
                                    <MdPhone size={15} /> {b.customer_phone}
                                </a>
                            )}
                            {b.customer_email && (
                                <a href={`mailto:${b.customer_email}`} className="truncate text-fog hover:text-white">
                                    {b.customer_email}
                                </a>
                            )}
                            {b.address && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-start gap-1.5 text-fog hover:text-white"
                                >
                                    <MdLocationOn size={15} className="mt-0.5 shrink-0" /> {b.address}
                                </a>
                            )}
                        </div>
                        {b.add_ons.length > 0 && (
                            <p className="mt-3 text-sm text-fog">
                                <span className="text-white/85">Add-ons:</span>{" "}
                                {b.add_ons.map((id) => BOOKABLE_ADD_ONS.find((a) => a.id === id)?.name ?? id).join(", ")}
                            </p>
                        )}
                        {b.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-fog"><span className="text-white/85">Customer notes:</span> {b.notes}</p>}
                        {b.admin_notes && <p className="mt-2 whitespace-pre-wrap text-sm text-fog"><span className="text-white/85">Your notes:</span> {b.admin_notes}</p>}

                        <p className="mt-4 border-t border-line pt-4 text-sm text-fog">
                            Total <strong className="text-white">{formatPrice(Number(b.total))}</strong> · Paid{" "}
                            <strong className="text-white">{formatPrice(Number(b.paid))}</strong>
                            {Number(b.refunded) > 0 && <> · Refunded <strong className="text-white">{formatPrice(Number(b.refunded))}</strong></>}
                            {live && <> · Due at party <strong className="text-gold">{formatPrice(due)}</strong></>}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {b.status === "requested" && (
                                <>
                                    <button type="button" className="btn-gold px-5! py-2!" onClick={() => onAction(b, "confirm")}>
                                        Confirm
                                    </button>
                                    <button type="button" className="btn-ghost px-5! py-2!" onClick={() => onAction(b, "decline")}>
                                        Decline &amp; refund
                                    </button>
                                </>
                            )}
                            <button type="button" className="btn-ghost px-5! py-2!" onClick={() => onEdit(b)}>
                                Edit
                            </button>
                            {live && (
                                <button type="button" className="btn-ghost px-5! py-2! text-red-300!" onClick={() => onAction(b, "cancel")}>
                                    Cancel party
                                </button>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function TimeOff({ blocks, onChange }: { blocks: BlockRow[]; onChange(): void }) {
    const today = todayInZone(Date.now());
    const [form, setForm] = useState({ startDate: today, endDate: today, startTime: "", endTime: "", reason: "" });
    const [busy, setBusy] = useState(false);
    const upcoming = blocks.filter((b) => Date.parse(b.end_at) > Date.now());

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api("/blocks", { method: "POST", body: form });
            toastSuccess("Time off added. Those times are closed for online booking.");
            setForm((f) => ({ ...f, reason: "" }));
            onChange();
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Couldn't add the time off.");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (b: BlockRow) => {
        if (!window.confirm("Reopen this time for online booking?")) return;
        try {
            await api(`/blocks/${b.id}`, { method: "DELETE" });
            onChange();
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Couldn't remove it.");
        }
    };

    const describe = (b: BlockRow) => {
        const s = utcToZoned(Date.parse(b.start_at));
        const e = utcToZoned(Date.parse(b.end_at) - 1);
        const allDay = s.time === "00:00" && utcToZoned(Date.parse(b.end_at)).time === "00:00";
        const d = (date: string) => formatDate(date, { year: undefined });
        if (allDay) return s.date === e.date ? `${d(s.date)} (all day)` : `${d(s.date)} – ${d(e.date)}`;
        return `${d(s.date)} ${formatTime(s.time)} – ${s.date === e.date ? "" : d(e.date) + " "}${formatTime(utcToZoned(Date.parse(b.end_at)).time)}`;
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <form onSubmit={add} className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white">Block off time</h2>
                <p className="mt-1 text-sm text-fog">Holidays, vacations, the trailer in the shop. Nobody can book these times online.</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className="text-sm font-semibold text-white">From</span>
                        <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate < e.target.value ? e.target.value : form.endDate })} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">To</span>
                        <input type="date" required min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block">
                        <span className="text-sm text-fog">Start time (blank = all day)</span>
                        <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block">
                        <span className="text-sm text-fog">End time (blank = all day)</span>
                        <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="col-span-2 block">
                        <span className="text-sm font-semibold text-white">Reason (optional)</span>
                        <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Thanksgiving" className={`${adminField} mt-1.5`} />
                    </label>
                </div>
                <button type="submit" className="btn-gold mt-5" disabled={busy}>
                    {busy ? "Saving…" : "Block this time"}
                </button>
            </form>
            <div>
                <h2 className="font-display text-lg font-semibold text-white">Coming up</h2>
                {upcoming.length ? (
                    <ul className="mt-3 space-y-2">
                        {upcoming.map((b) => (
                            <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm">
                                <span>
                                    <span className="font-semibold text-white">{describe(b)}</span>
                                    {b.reason && <span className="block text-fog">{b.reason}</span>}
                                </span>
                                <button type="button" onClick={() => remove(b)} className="shrink-0 font-semibold text-fog hover:text-red-300">
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-3 text-sm text-fog">No time off scheduled.</p>
                )}
            </div>
        </div>
    );
}

function Settings({
    settings,
    calendarUrl,
    onSaved,
}: {
    settings: BookingSettings;
    calendarUrl: string | null;
    onSaved(s: BookingSettings): void;
}) {
    const [s, setS] = useState(settings);
    const [busy, setBusy] = useState(false);
    const setDay = (d: number, value: { open: string; close: string } | null) => setS({ ...s, hours: { ...s.hours, [d]: value } });
    const num = (key: "crews" | "bufferMinutes" | "minNoticeHours" | "maxAdvanceDays") => ({
        value: s[key],
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [key]: Number(e.target.value) }),
    });

    const save = async () => {
        setBusy(true);
        try {
            const { settings: saved } = await api<{ settings: BookingSettings }>("/settings", { method: "PUT", body: { settings: s } });
            setS(saved);
            onSaved(saved);
            toastSuccess("Saved. The booking page uses the new hours now.");
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Couldn't save.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white">Booking hours</h2>
                <p className="mt-1 text-sm text-fog">Parties can start at the opening time and must end by the closing time.</p>
                <ul className="mt-5 space-y-2">
                    {WEEKDAYS.map((name, d) => {
                        const h = s.hours[String(d)];
                        return (
                            <li key={name} className="flex flex-wrap items-center gap-3">
                                <label className="flex w-36 items-center gap-2 text-sm font-semibold text-white">
                                    <input
                                        type="checkbox"
                                        checked={!!h}
                                        onChange={(e) => setDay(d, e.target.checked ? { open: "12:00", close: "20:00" } : null)}
                                        className="h-4 w-4 accent-[#ffb02e]"
                                    />
                                    {name}
                                </label>
                                {h ? (
                                    <span className="flex items-center gap-2">
                                        <input type="time" value={h.open} onChange={(e) => setDay(d, { ...h, open: e.target.value })} className={`${adminField} w-32`} aria-label={`${name} opening time`} />
                                        <span className="text-fog">to</span>
                                        <input type="time" value={h.close} onChange={(e) => setDay(d, { ...h, close: e.target.value })} className={`${adminField} w-32`} aria-label={`${name} closing time`} />
                                    </span>
                                ) : (
                                    <span className="text-sm text-fog">Closed</span>
                                )}
                            </li>
                        );
                    })}
                </ul>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Parties at the same time</span>
                        <input type="number" min={1} max={10} {...num("crews")} className={`${adminField} mt-1.5`} />
                        <span className="mt-1 block text-xs text-fog">How many crews can run parties at once.</span>
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Minutes free after each party</span>
                        <input type="number" min={0} step={15} {...num("bufferMinutes")} className={`${adminField} mt-1.5`} />
                        <span className="mt-1 block text-xs text-fog">Pack-up and travel time.</span>
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Hours of notice needed</span>
                        <input type="number" min={0} {...num("minNoticeHours")} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Days ahead people can book</span>
                        <input type="number" min={1} {...num("maxAdvanceDays")} className={`${adminField} mt-1.5`} />
                    </label>
                </div>
                <button type="button" onClick={save} className="btn-gold mt-6" disabled={busy}>
                    {busy ? "Saving…" : "Save settings"}
                </button>
            </div>
            <div className="card h-fit p-6">
                <h2 className="font-display text-lg font-semibold text-white">Put parties on your phone's calendar</h2>
                {calendarUrl ? (
                    <>
                        <p className="mt-2 text-sm leading-relaxed text-fog">
                            Copy this private link. In Google Calendar choose <strong className="text-white">Other calendars → From URL</strong>; on
                            an iPhone go to <strong className="text-white">Settings → Calendar → Accounts → Add Subscribed Calendar</strong>. New
                            bookings show up on their own (Google can take a few hours to refresh). Don't share the link.
                        </p>
                        <div className="mt-4 flex gap-2">
                            <input readOnly value={calendarUrl} className={`${adminField} font-mono text-xs`} onFocus={(e) => e.target.select()} />
                            <button
                                type="button"
                                className="btn-ghost shrink-0 px-4!"
                                onClick={() => navigator.clipboard.writeText(calendarUrl).then(() => toastSuccess("Link copied"))}
                                aria-label="Copy link"
                            >
                                <MdContentCopy size={16} />
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="mt-2 text-sm text-fog">The calendar link turns on once CALENDAR_TOKEN is set in Cloudflare.</p>
                )}
            </div>
        </div>
    );
}

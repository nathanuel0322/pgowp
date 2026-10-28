import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MdAdd, MdCheck, MdLock, MdPhone, MdRemove } from "react-icons/md";
import { apilink, toastError } from "../GlobalFunctions";
import AddressPicker from "../components/booking/AddressPicker";
import MonthCalendar from "../components/booking/MonthCalendar";
import Turnstile, { TurnstileHandle } from "../components/Turnstile";
import { formatPrice } from "../data/packages";
import {
    BookingError,
    bookableAddOnGroups,
    MAX_CHILDREN,
    TIME_ZONE,
    formatDate,
    formatTime,
    quoteBooking,
    type AddOnChoice,
} from "../lib/booking";
import { getCatalog, useCatalog } from "../lib/catalogStore";
import { SITE } from "../site";
import { field } from "../components/booking/field";

const DRAFT_KEY = "booking-draft";

interface Draft {
    packageId: string;
    addOns: AddOnChoice[];
    date: string | null;
    time: string | null;
    name: string;
    email: string;
    phone: string;
    address: string;
    // Google Maps place id of the picked address. Empty until the customer picks one from the suggestions.
    placeId: string;
    notes: string;
}

const emptyDraft: Draft = {
    packageId: "",
    addOns: [],
    date: null,
    time: null,
    name: "",
    email: "",
    phone: "",
    address: "",
    placeId: "",
    notes: "",
};

function loadDraft(): Draft {
    try {
        const saved = sessionStorage.getItem(DRAFT_KEY);
        return saved ? { ...emptyDraft, ...JSON.parse(saved) } : emptyDraft;
    } catch {
        return emptyDraft;
    }
}

const thisMonth = () =>
    new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit" }).slice(0, 7);

function Step({ n, title, children, muted }: { n: number; title: string; children: React.ReactNode; muted?: boolean }) {
    return (
        <section className={`card p-6 transition-opacity sm:p-8 ${muted ? "opacity-50" : ""}`} aria-disabled={muted}>
            <h2 className="flex items-center gap-3 font-display text-lg font-semibold text-white">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/15 text-sm text-gold ring-1 ring-gold/30">
                    {n}
                </span>
                {title}
            </h2>
            <div className="mt-6">{children}</div>
        </section>
    );
}

export default function BookParty() {
    const [params] = useSearchParams();
    const catalog = useCatalog();
    const addOnGroups = useMemo(() => bookableAddOnGroups(catalog), [catalog]);
    const [draft, setDraft] = useState<Draft>(() => {
        const d = loadDraft();
        const fromUrl = params.get("package");
        return fromUrl && getCatalog().packages.some((p) => p.id === fromUrl) && fromUrl !== d.packageId
            ? { ...d, packageId: fromUrl, date: null, time: null }
            : d;
    });
    const [month, setMonth] = useState(() => (draft.date ? draft.date.slice(0, 7) : thisMonth()));
    const [days, setDays] = useState<Record<string, string[]>>({});
    // The month `days` was loaded for, so a picked time isn't dropped before its month has loaded.
    const [daysMonth, setDaysMonth] = useState<string | null>(null);
    const [loadingDays, setLoadingDays] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [token, setToken] = useState<string | null>(null);
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const turnstile = useRef<TurnstileHandle>(null);

    const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

    useEffect(() => {
        try {
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch {
            /* storage unavailable */
        }
    }, [draft]);

    // Back from Stripe without paying: free the hold on the picked time before loading open times, so it's still open.
    const [releasing, setReleasing] = useState(() => Boolean(params.get("canceled") && params.get("booking")));

    useEffect(() => {
        if (!params.get("canceled")) return;
        toastError("Payment canceled. Your party isn't booked yet.");
        const booking = params.get("booking");
        if (!booking) return;
        fetch(`${apilink}/booking/release`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: booking }),
        })
            .catch(() => undefined)
            .finally(() => setReleasing(false));
    }, [params]);

    const quote = useMemo(() => {
        if (!draft.packageId) return null;
        try {
            return quoteBooking(draft.packageId, draft.addOns, catalog);
        } catch (error) {
            if (error instanceof BookingError) return null;
            throw error;
        }
    }, [draft.packageId, draft.addOns, catalog]);

    // Only add-ons that change the party length affect which times are open.
    const timingAddOns = draft.addOns
        .filter((a) => addOnGroups.some((g) => g.items.some((i) => i.id === a.id && i.minutes)))
        .map((a) => `${a.id}:${a.qty}`)
        .join(",");

    useEffect(() => {
        if (!draft.packageId || releasing) return;
        const controller = new AbortController();
        setLoadingDays(true);
        const qs = new URLSearchParams({ package: draft.packageId, month, addons: timingAddOns });
        fetch(`${apilink}/booking/availability?${qs}`, { signal: controller.signal })
            .then(async (res) => {
                const json = await res.json().catch(() => null);
                if (!res.ok) throw new Error(json?.message ?? "Couldn't load open dates.");
                setDays(json.days ?? {});
                setDaysMonth(month);
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                setDays({});
                toastError(error.message || "Couldn't load open dates. Please try again or call us.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingDays(false);
            });
        return () => controller.abort();
    }, [draft.packageId, month, timingAddOns, refresh, releasing]);

    // Drop a picked time that's no longer open (another booking, or the party got longer).
    useEffect(() => {
        if (loadingDays || !draft.date || draft.date.slice(0, 7) !== month || daysMonth !== month) return;
        if (!draft.time || !days[draft.date]?.includes(draft.time)) update({ time: null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days, loadingDays, daysMonth]);

    const setAddOn = (id: string, qty: number | null) =>
        update({
            addOns: qty === null ? draft.addOns.filter((a) => a.id !== id) : [...draft.addOns.filter((a) => a.id !== id), { id, qty }],
        });

    const times = draft.date ? days[draft.date] ?? [] : [];
    const ready =
        quote && draft.date && draft.time && draft.name.trim() && draft.email.trim() && draft.phone.trim() && draft.placeId;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quote) return toastError("Please pick a party package.");
        if (!draft.date || !draft.time) return toastError("Please pick a date and start time.");
        if (!draft.placeId) return toastError("Please pick your party address from the Google Maps suggestions.");
        if (!agreed) return toastError("Please agree to the cancellation policy.");
        if (!token) return toastError("Please wait a moment for the spam check to finish, then try again.");
        setSubmitting(true);
        try {
            const res = await fetch(`${apilink}/booking/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    package: draft.packageId,
                    addOns: draft.addOns,
                    date: draft.date,
                    time: draft.time,
                    name: draft.name,
                    email: draft.email,
                    phone: draft.phone,
                    address: draft.address,
                    place_id: draft.placeId,
                    notes: draft.notes,
                    turnstile_token: token,
                }),
            });
            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.url) {
                toastError(json?.message ?? "We couldn't start checkout. Please try again or call us.");
                // Someone else just took the slot: reload the open times.
                if (res.status === 409) setRefresh((r) => r + 1);
                turnstile.current?.reset();
                setSubmitting(false);
                return;
            }
            window.location.href = json.url;
        } catch (error) {
            console.error("Checkout failed:", error);
            toastError("We couldn't start checkout. Please try again or call us.");
            turnstile.current?.reset();
            setSubmitting(false);
        }
    };

    return (
        <section className="relative overflow-clip pb-8 pt-28 lg:pt-36">
            <div aria-hidden className="grid-bg absolute inset-x-0 top-0 h-[520px] opacity-60" />
            <div aria-hidden className="glow-gold absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2" />
            <div className="wrap relative">
                <p className="eyebrow">Book online</p>
                <h1 className="h-display mt-4 text-[2.1rem] sm:text-5xl">
                    Lock in your <span className="text-gradient">party date</span>
                </h1>
                <p className="lede mt-4 max-w-2xl">
                    Pick a package, choose an open time and pay the deposit to hold your date. The balance, add-ons and any
                    travel or holiday surcharges are due when we arrive.
                </p>

                <form onSubmit={submit} className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
                    <div className="grid gap-6">
                        <Step n={1} title="Choose your party">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {catalog.packages.map((p) => {
                                    const selected = draft.packageId === p.id;
                                    return (
                                        <label
                                            key={p.id}
                                            className={`relative flex cursor-pointer flex-col rounded-2xl border p-5 transition ${
                                                selected ? "border-gold/70 bg-gold/[0.08]" : "border-line bg-ink/40 hover:border-white/25"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="package"
                                                value={p.id}
                                                checked={selected}
                                                onChange={() => update({ packageId: p.id, time: null })}
                                                className="sr-only"
                                            />
                                            <span className="flex items-start justify-between gap-3">
                                                <span className="font-semibold text-white">{p.name}</span>
                                                {selected && <MdCheck className="shrink-0 text-gold" size={20} aria-hidden />}
                                            </span>
                                            <span className="mt-2 font-display text-2xl font-bold text-white">{formatPrice(p.price)}</span>
                                            <span className="mt-1 text-sm text-fog">
                                                {p.duration} · {formatPrice(p.deposit)} deposit today
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="mt-4 text-sm text-fog">
                                School, church, corporate or block party?{" "}
                                <a href={SITE.phoneHref} className="font-semibold text-gold hover:underline">
                                    Call {SITE.phone}
                                </a>{" "}
                                for a custom quote.
                            </p>
                        </Step>

                        <Step n={2} title="Add extras (optional)" muted={!quote}>
                            <p className="-mt-2 mb-5 text-sm text-fog">Add-ons are paid on the day, not today.</p>
                            <div className="grid gap-6">
                                {addOnGroups.map((group) => (
                                    <fieldset key={group.title} disabled={!quote}>
                                        <legend className="text-xs font-semibold uppercase tracking-wider text-fog">{group.title}</legend>
                                        <ul className="mt-2 divide-y divide-line">
                                            {group.items.map((item) => {
                                                const choice = draft.addOns.find((a) => a.id === item.id);
                                                const counted = item.perChild || item.minutes;
                                                return (
                                                    <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                                                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!choice}
                                                                onChange={(e) =>
                                                                    setAddOn(item.id, e.target.checked ? (item.perChild ? 10 : 1) : null)
                                                                }
                                                                className="mt-1 h-4 w-4 shrink-0 accent-[#ffb02e]"
                                                            />
                                                            <span className="min-w-0">
                                                                <span className="block font-semibold text-white/90">{item.name}</span>
                                                                {item.note && <span className="block text-xs text-fog">{item.note}</span>}
                                                            </span>
                                                        </label>
                                                        {choice && counted && (
                                                            <Quantity
                                                                label={item.perChild ? "Kids" : "Hours"}
                                                                value={choice.qty}
                                                                min={1}
                                                                max={item.perChild ? MAX_CHILDREN : 4}
                                                                onChange={(qty) => setAddOn(item.id, qty)}
                                                            />
                                                        )}
                                                        <span className="w-16 shrink-0 text-right font-display font-semibold text-gold">
                                                            {formatPrice((item.price ?? 0) * (choice?.qty ?? 1))}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </fieldset>
                                ))}
                            </div>
                        </Step>

                        <Step n={3} title="Pick a date and time" muted={!quote}>
                            {quote ? (
                                <div className="grid gap-8 md:grid-cols-[1fr_250px]">
                                    <MonthCalendar
                                        month={month}
                                        onMonthChange={setMonth}
                                        minMonth={thisMonth()}
                                        selected={draft.date}
                                        onSelect={(date) => update({ date, time: null })}
                                        isOpen={(date) => !!days[date]?.length}
                                        loading={loadingDays}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-white/85">
                                            {draft.date ? formatDate(draft.date, { year: undefined }) : "Pick a day to see start times"}
                                        </p>
                                        {draft.date && (
                                            <div className="mt-3 grid max-h-[22rem] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-2">
                                                {times.length ? (
                                                    times.map((t) => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            onClick={() => update({ time: t })}
                                                            aria-pressed={draft.time === t}
                                                            className={`whitespace-nowrap rounded-xl px-2 py-2.5 text-sm font-semibold transition ${
                                                                draft.time === t
                                                                    ? "bg-gold text-ink"
                                                                    : "bg-white/[0.06] text-white ring-1 ring-line hover:ring-gold/60"
                                                            }`}
                                                        >
                                                            {formatTime(t)}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-fog">No open times left that day.</p>
                                                )}
                                            </div>
                                        )}
                                        {!loadingDays && !Object.keys(days).length && (
                                            <p className="mt-3 text-sm text-fog">
                                                Nothing open this month online. Try the next month or call us.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-fog">Choose a party first.</p>
                            )}
                        </Step>

                        <Step n={4} title="Your details">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <label className="grid gap-2 text-sm font-semibold text-white/85">
                                    Your name *
                                    <input
                                        required
                                        autoComplete="name"
                                        value={draft.name}
                                        onChange={(e) => update({ name: e.target.value })}
                                        className={field}
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold text-white/85">
                                    Email *
                                    <input
                                        required
                                        type="email"
                                        autoComplete="email"
                                        value={draft.email}
                                        onChange={(e) => update({ email: e.target.value })}
                                        className={field}
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold text-white/85">
                                    Phone *
                                    <input
                                        required
                                        type="tel"
                                        autoComplete="tel"
                                        value={draft.phone}
                                        onChange={(e) => update({ phone: e.target.value })}
                                        className={field}
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold text-white/85 sm:col-span-2">
                                    Party address *
                                    <AddressPicker
                                        value={{ address: draft.address, placeId: draft.placeId }}
                                        onChange={(picked) => update(picked)}
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-semibold text-white/85 sm:col-span-2">
                                    Anything we should know?
                                    <textarea
                                        rows={3}
                                        placeholder="Guest of honor, age, number of kids, parking notes..."
                                        value={draft.notes}
                                        onChange={(e) => update({ notes: e.target.value })}
                                        className={`${field} resize-y`}
                                    />
                                </label>
                            </div>
                            <ul className="mt-6 space-y-2 text-sm text-fog">
                                <li>Please have at least 5 car lengths of parking for the trailer.</li>
                                <li>
                                    Parties outside Queens, Brooklyn and Nassau County have a travel surcharge. Holidays and
                                    holiday weekends cost extra.
                                </li>
                            </ul>
                        </Step>
                    </div>

                    <aside className="card p-6 sm:p-7 lg:sticky lg:top-28">
                        <h2 className="font-display text-lg font-semibold text-white">Summary</h2>
                        {quote ? (
                            <dl className="mt-5 space-y-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-white/90">{quote.pkg.name}</dt>
                                    <dd className="font-semibold text-white">{formatPrice(quote.pkg.price)}</dd>
                                </div>
                                {quote.addOns.map((a) => (
                                    <div key={a.id} className="flex justify-between gap-4">
                                        <dt className="text-fog">
                                            {a.name}
                                            {a.qty > 1 ? ` × ${a.qty}` : ""}
                                        </dt>
                                        <dd className="text-white/90">{formatPrice(a.total)}</dd>
                                    </div>
                                ))}
                                {draft.date && (
                                    <div className="border-t border-line pt-3 text-white/90">
                                        {formatDate(draft.date)}
                                        {draft.time && <span className="block text-fog">Starts {formatTime(draft.time)}</span>}
                                    </div>
                                )}
                                <div className="flex justify-between gap-4 border-t border-line pt-3">
                                    <dt className="text-fog">Total</dt>
                                    <dd className="text-white/90">{formatPrice(quote.total)}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-fog">Due on the day</dt>
                                    <dd className="text-white/90">{formatPrice(quote.balance)}</dd>
                                </div>
                                <div className="flex justify-between gap-4 text-base">
                                    <dt className="font-semibold text-white">Deposit due today</dt>
                                    <dd className="font-display font-bold text-gold">{formatPrice(quote.deposit)}</dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="mt-4 text-sm text-fog">Pick a party to see your total.</p>
                        )}

                        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-fog">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0 accent-[#ffb02e]"
                            />
                            <span>
                                I agree to the 48-hour cancellation policy: cancelling with less than 48 hours' notice, or
                                missing the party, forfeits the deposit.
                            </span>
                        </label>
                        <div className="mt-5">
                            <Turnstile
                                ref={turnstile}
                                siteKey={SITE.turnstileSiteKey}
                                action="booking"
                                onToken={setToken}
                                onError={() => toastError("The spam check couldn't load. Refresh the page or call us instead.")}
                            />
                        </div>
                        <button type="submit" className="btn-gold mt-4 w-full !py-4" disabled={!ready || !agreed || submitting}>
                            <MdLock size={18} aria-hidden />
                            {submitting ? "Opening secure checkout..." : quote ? `Pay ${formatPrice(quote.deposit)} deposit` : "Pay deposit"}
                        </button>
                        <p className="mt-3 text-center text-xs text-fog">Secure payment by Stripe. Your slot is held for 30 minutes.</p>
                        <a href={SITE.phoneHref} className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-white hover:text-gold">
                            <MdPhone className="text-gold" aria-hidden /> Questions? {SITE.phone}
                        </a>
                    </aside>
                </form>
            </div>
        </section>
    );
}

function Quantity({
    label,
    value,
    min,
    max,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange(value: number): void;
}) {
    return (
        <span className="flex items-center gap-2 text-sm text-fog">
            {label}
            <span className="flex items-center rounded-full border border-line">
                <button
                    type="button"
                    className="grid h-8 w-8 place-items-center text-white disabled:opacity-30"
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                    aria-label={`Fewer ${label.toLowerCase()}`}
                >
                    <MdRemove />
                </button>
                <input
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => {
                        const n = Math.round(Number(e.target.value));
                        if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
                    }}
                    aria-label={label}
                    className="w-10 bg-transparent text-center font-semibold text-white [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                    type="button"
                    className="grid h-8 w-8 place-items-center text-white disabled:opacity-30"
                    onClick={() => onChange(Math.min(max, value + 1))}
                    disabled={value >= max}
                    aria-label={`More ${label.toLowerCase()}`}
                >
                    <MdAdd />
                </button>
            </span>
        </span>
    );
}

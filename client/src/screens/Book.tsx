import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MdAdd, MdCheck, MdLock, MdPhone, MdRemove } from "react-icons/md";
import MonthCalendar, { shiftMonth } from "../components/booking/MonthCalendar";
import Turnstile, { TurnstileHandle } from "../components/Turnstile";
import { addOnsFor, findPackage, quote, QuoteError } from "../booking/quote";
import { formatDate, formatTime, todayInZone } from "../booking/time";
import { ADD_ON_GROUPS, CANCELLATION_POLICY, EXTRA_HOUR_PRICE, MAX_EXTRA_HOURS, PARTY_PACKAGES, formatPrice } from "../data/packages";
import { apilink, toastError } from "../GlobalFunctions";
import { SERVICE_AREAS, SITE } from "../site";

const field =
    "w-full rounded-xl border border-line bg-ink/60 px-4 py-3.5 text-[15px] text-white placeholder:text-fog/60 transition focus:border-gold/60 focus:outline-hidden focus:ring-2 focus:ring-gold/20";

const thisMonth = () => todayInZone(Date.now()).slice(0, 7);

function Step({ n, title, children, disabled }: { n: number; title: string; children: React.ReactNode; disabled?: boolean }) {
    return (
        <section className={`card p-6 sm:p-8 ${disabled ? "pointer-events-none opacity-40" : ""}`} aria-disabled={disabled}>
            <h2 className="flex items-center gap-3 font-display text-xl font-semibold text-white">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-ink">
                    {n}
                </span>
                {title}
            </h2>
            <div className="mt-6">{children}</div>
        </section>
    );
}

export default function Book() {
    const [params] = useSearchParams();
    const [packageId, setPackageId] = useState(() => (findPackage(params.get("package") ?? "") ? params.get("package")! : ""));
    const [guests, setGuests] = useState(15);
    const [extraHours, setExtraHours] = useState(0);
    const [addOns, setAddOns] = useState<string[]>([]);

    const [month, setMonth] = useState(thisMonth);
    const [days, setDays] = useState<Record<string, string[]>>({});
    const [loadingDays, setLoadingDays] = useState(false);
    const [lastBookable, setLastBookable] = useState<string | null>(null);
    const [date, setDate] = useState<string | null>(null);
    const [time, setTime] = useState<string | null>(null);
    const [refresh, setRefresh] = useState(0);
    const autoAdvanced = useRef(0);

    const [details, setDetails] = useState({ name: "", email: "", phone: "", address: "", guestOfHonor: "", notes: "" });
    const [agree, setAgree] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const turnstile = useRef<TurnstileHandle>(null);
    const dateStep = useRef<HTMLDivElement>(null);

    const pkg = findPackage(packageId);

    useEffect(() => {
        if (params.get("canceled")) toastError("Payment canceled. Your party wasn't booked, but you can try again.");
    }, [params]);

    // Add-ons that don't go with the new package are dropped.
    useEffect(() => {
        if (pkg) setAddOns((prev) => prev.filter((id) => addOnsFor(pkg).some((a) => a.id === id)));
    }, [pkg]);

    useEffect(() => {
        if (!pkg) return;
        const controller = new AbortController();
        setLoadingDays(true);
        fetch(`${apilink}/booking/availability?package=${pkg.id}&extraHours=${extraHours}&month=${month}`, {
            signal: controller.signal,
        })
            .then(async (res) => {
                const body = await res.json();
                if (!res.ok) throw new Error(body.message);
                setDays(body.days);
                setLastBookable(body.lastBookableDate);
                // Skip ahead when the rest of this month is already full.
                if (!Object.keys(body.days).length && month === thisMonth() && autoAdvanced.current < 2) {
                    autoAdvanced.current++;
                    setMonth(shiftMonth(month, 1));
                }
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                console.error("Error loading availability:", error);
                setDays({});
                toastError("We couldn't load the calendar. Please refresh or give us a call.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingDays(false);
            });
        return () => controller.abort();
    }, [pkg, extraHours, month, refresh]);

    // A picked time that's no longer open (different package length, or someone else took it) is cleared.
    useEffect(() => {
        if (loadingDays || !date || !date.startsWith(month)) return;
        if (!days[date]) {
            setDate(null);
            setTime(null);
        } else if (time && !days[date].includes(time)) setTime(null);
    }, [days, loadingDays, date, time, month]);

    const priced = useMemo(() => {
        if (!pkg) return null;
        try {
            return quote({ packageId: pkg.id, addOns, extraHours, guests });
        } catch (error) {
            if (error instanceof QuoteError) return error;
            throw error;
        }
    }, [pkg, addOns, extraHours, guests]);

    const open = useMemo(() => new Set(Object.keys(days)), [days]);
    const times = date ? (days[date] ?? []) : [];
    const periods = [
        { label: "Morning", times: times.filter((t) => t < "12:00") },
        { label: "Afternoon", times: times.filter((t) => t >= "12:00" && t < "17:00") },
        { label: "Evening", times: times.filter((t) => t >= "17:00") },
    ].filter((p) => p.times.length);

    const set = (key: keyof typeof details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDetails((d) => ({ ...d, [key]: e.target.value }));

    const choosePackage = (id: string) => {
        setPackageId(id);
        const next = findPackage(id)!;
        if (guests > next.maxGuests) setGuests(next.maxGuests);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pkg || !priced || priced instanceof QuoteError) return toastError("Please finish choosing your party.");
        if (!date || !time) {
            dateStep.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            return toastError("Please pick a date and time.");
        }
        if (!agree) return toastError("Please agree to the cancellation policy.");
        if (!token) return toastError("Please wait a moment for the spam check to finish, then try again.");
        setSubmitting(true);
        try {
            const res = await fetch(`${apilink}/booking/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packageId: pkg.id,
                    addOns,
                    extraHours,
                    guests,
                    date,
                    time,
                    ...details,
                    agree,
                    turnstileToken: token,
                }),
            });
            const body = await res.json().catch(() => ({}));
            if (res.ok && body.url) {
                window.location.href = body.url;
                return;
            }
            toastError(body.message ?? "Something went wrong. Please try again or give us a call.");
            if (body.code === "slot_taken") {
                setTime(null);
                setRefresh((r) => r + 1);
                dateStep.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        } catch (error) {
            console.error("Error starting checkout:", error);
            toastError("We couldn't reach the booking system. Please check your connection and try again.");
        }
        // Each spam-check token works only once.
        turnstile.current?.reset();
        setSubmitting(false);
    };

    const minMonth = thisMonth();
    const maxMonth = lastBookable ? lastBookable.slice(0, 7) : shiftMonth(minMonth, 12);
    const ready = priced instanceof QuoteError ? null : priced;

    return (
        <div className="relative pb-8 pt-28 lg:pt-36">
            <div aria-hidden className="grid-bg absolute inset-x-0 top-0 h-[520px] opacity-50" />
            <div aria-hidden className="glow-gold absolute -top-40 left-1/2 h-[420px] w-[800px] -translate-x-1/2" />
            <div className="wrap relative">
                <p className="eyebrow">Book online</p>
                <h1 className="h-display mt-4 text-[2.1rem] sm:text-5xl">
                    Book your <span className="text-gradient">party</span>
                </h1>
                <p className="lede mt-4 max-w-2xl">
                    Pick a package, choose an open time and pay the deposit to hold it. The balance is due when we
                    arrive, and we'll email you to confirm.
                </p>

                <form onSubmit={submit} className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
                    <div className="space-y-6">
                        <Step n={1} title="Choose your party">
                            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Party package">
                                {PARTY_PACKAGES.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={packageId === p.id}
                                        onClick={() => choosePackage(p.id)}
                                        className={`rounded-2xl border p-5 text-left transition ${
                                            packageId === p.id
                                                ? "border-gold bg-gold/10 shadow-[0_0_0_1px_#ffb02e]"
                                                : "border-line bg-ink/40 hover:border-white/25"
                                        }`}
                                    >
                                        <span className="flex items-start justify-between gap-3">
                                            <span className="font-display font-semibold text-white">{p.name}</span>
                                            {packageId === p.id && <MdCheck className="shrink-0 text-gold" size={20} />}
                                        </span>
                                        <span className="mt-2 block text-sm text-fog">
                                            {formatPrice(p.price)} · {p.duration}
                                        </span>
                                        <span className="mt-1 block text-xs font-semibold text-gold">
                                            {formatPrice(p.deposit)} deposit today
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {pkg && (
                                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="guests" className="text-sm font-semibold text-white">
                                            How many guests?
                                        </label>
                                        <div className="mt-2 flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line text-white hover:border-gold/50"
                                                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                                                aria-label="Fewer guests"
                                            >
                                                <MdRemove size={20} />
                                            </button>
                                            <input
                                                id="guests"
                                                type="number"
                                                inputMode="numeric"
                                                min={1}
                                                max={pkg.maxGuests}
                                                value={guests || ""}
                                                onChange={(e) => setGuests(Math.max(0, Math.floor(Number(e.target.value))))}
                                                className={`${field} text-center`}
                                            />
                                            <button
                                                type="button"
                                                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line text-white hover:border-gold/50"
                                                onClick={() => setGuests((g) => Math.min(pkg.maxGuests, g + 1))}
                                                aria-label="More guests"
                                            >
                                                <MdAdd size={20} />
                                            </button>
                                        </div>
                                        <p className="mt-2 text-xs text-fog">
                                            {pkg.includedGuests && pkg.extraGuestPrice
                                                ? `Covers up to ${pkg.includedGuests} kids, then ${formatPrice(pkg.extraGuestPrice)} per extra child.`
                                                : `Up to ${pkg.maxGuests} ${pkg.id === "laser-tag" ? "players" : "guests"} online. Bigger group? Call us.`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white" id="extra-hours-label">
                                            Extra party time
                                        </p>
                                        <div className="mt-2 grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="extra-hours-label">
                                            {Array.from({ length: MAX_EXTRA_HOURS + 1 }, (_, h) => (
                                                <button
                                                    key={h}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={extraHours === h}
                                                    onClick={() => setExtraHours(h)}
                                                    className={`h-12 rounded-xl border text-sm font-bold transition ${
                                                        extraHours === h
                                                            ? "border-gold bg-gold text-ink"
                                                            : "border-line text-white hover:border-white/25"
                                                    }`}
                                                >
                                                    {h ? `+${h} hr` : "None"}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="mt-2 text-xs text-fog">{formatPrice(EXTRA_HOUR_PRICE)} per extra hour.</p>
                                    </div>
                                </div>
                            )}

                            {pkg && (
                                <fieldset className="mt-8">
                                    <legend className="text-sm font-semibold text-white">Add-ons (optional)</legend>
                                    <div className="mt-3 space-y-5">
                                        {ADD_ON_GROUPS.map((group) => {
                                            const items = addOnsFor(pkg).filter((a) => group.items.some((i) => i.id === a.id));
                                            if (!items.length) return null;
                                            return (
                                                <div key={group.title}>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-fog">{group.title}</p>
                                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                        {items.map((a) => {
                                                            const on = addOns.includes(a.id);
                                                            return (
                                                                <label
                                                                    key={a.id}
                                                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                                                                        on ? "border-gold/60 bg-gold/10" : "border-line hover:border-white/25"
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={on}
                                                                        onChange={() =>
                                                                            setAddOns((prev) =>
                                                                                on ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                                                                            )
                                                                        }
                                                                        className="mt-1 h-4 w-4 shrink-0 accent-[#ffb02e]"
                                                                    />
                                                                    <span className="min-w-0 flex-1">
                                                                        <span className="block text-sm font-semibold text-white">{a.name}</span>
                                                                        {a.note && <span className="block text-xs text-fog">{a.note}</span>}
                                                                    </span>
                                                                    <span className="shrink-0 text-sm font-semibold text-gold">
                                                                        {formatPrice(a.price)}
                                                                        {a.perGuest ? "/child" : ""}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            )}
                        </Step>

                        <div ref={dateStep} className="scroll-mt-24">
                            <Step n={2} title="Pick a date and time" disabled={!pkg}>
                                <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
                                    <MonthCalendar
                                        month={month}
                                        open={open}
                                        selected={date}
                                        loading={loadingDays}
                                        minMonth={minMonth}
                                        maxMonth={maxMonth}
                                        onSelect={(d) => {
                                            setDate(d);
                                            setTime(null);
                                        }}
                                        onMonthChange={setMonth}
                                    />
                                    <div>
                                        {date ? (
                                            <>
                                                <p className="font-display font-semibold text-white">{formatDate(date, { year: undefined })}</p>
                                                <p className="mt-1 text-xs text-fog">
                                                    Start times, New York time. Your party runs{" "}
                                                    {pkg ? (pkg.minutes + extraHours * 60) / 60 : 0} hours including setup.
                                                </p>
                                                <div className="mt-4 space-y-4">
                                                    {periods.map((p) => (
                                                        <div key={p.label}>
                                                            <p className="text-xs font-semibold uppercase tracking-wider text-fog">{p.label}</p>
                                                            <div className="mt-2 grid grid-cols-3 gap-2">
                                                                {p.times.map((t) => (
                                                                    <button
                                                                        key={t}
                                                                        type="button"
                                                                        aria-pressed={time === t}
                                                                        onClick={() => setTime(t)}
                                                                        className={`rounded-xl border py-2.5 text-sm font-bold transition ${
                                                                            time === t
                                                                                ? "border-gold bg-gold text-ink"
                                                                                : "border-line text-white hover:border-gold/50"
                                                                        }`}
                                                                    >
                                                                        {formatTime(t)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="grid h-full min-h-40 place-items-center rounded-2xl border border-dashed border-line p-6 text-center text-sm text-fog">
                                                {loadingDays
                                                    ? "Checking open dates…"
                                                    : open.size
                                                      ? "Pick a highlighted date to see open start times."
                                                      : "No open dates this month. Try the next month, or give us a call."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-6 text-sm text-fog">
                                    Don't see a time that works?{" "}
                                    <a href={SITE.phoneHref} className="font-semibold text-gold hover:underline">
                                        Call {SITE.phone}
                                    </a>{" "}
                                    and we'll do our best to fit you in.
                                </p>
                            </Step>
                        </div>

                        <Step n={3} title="Your details" disabled={!pkg}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="text-sm font-semibold text-white">Full name</span>
                                    <input required autoComplete="name" value={details.name} onChange={set("name")} className={`${field} mt-2`} />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-semibold text-white">Phone</span>
                                    <input
                                        required
                                        type="tel"
                                        autoComplete="tel"
                                        value={details.phone}
                                        onChange={set("phone")}
                                        placeholder="(718) 555-0123"
                                        className={`${field} mt-2`}
                                    />
                                </label>
                                <label className="block sm:col-span-2">
                                    <span className="text-sm font-semibold text-white">Email</span>
                                    <input
                                        required
                                        type="email"
                                        autoComplete="email"
                                        value={details.email}
                                        onChange={set("email")}
                                        className={`${field} mt-2`}
                                    />
                                </label>
                                <label className="block sm:col-span-2">
                                    <span className="text-sm font-semibold text-white">Party address</span>
                                    <input
                                        required
                                        autoComplete="street-address"
                                        value={details.address}
                                        onChange={set("address")}
                                        placeholder="Street, city, ZIP"
                                        className={`${field} mt-2`}
                                    />
                                    <span className="mt-2 block text-xs text-fog">
                                        Please have at least 5 car spaces free for the trailer. Parties outside{" "}
                                        {SERVICE_AREAS.standard.join(", ")} may have a travel surcharge.
                                    </span>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-semibold text-white">
                                        Guest of honor <span className="font-normal text-fog">(optional)</span>
                                    </span>
                                    <input value={details.guestOfHonor} onChange={set("guestOfHonor")} className={`${field} mt-2`} />
                                </label>
                                <label className="block sm:col-span-2">
                                    <span className="text-sm font-semibold text-white">
                                        Anything we should know? <span className="font-normal text-fog">(optional)</span>
                                    </span>
                                    <textarea
                                        rows={3}
                                        value={details.notes}
                                        onChange={set("notes")}
                                        placeholder="Parking, gate codes, twins, a favorite game…"
                                        className={`${field} mt-2 resize-y`}
                                    />
                                </label>
                            </div>
                            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-ink/40 p-4">
                                <input
                                    type="checkbox"
                                    checked={agree}
                                    onChange={(e) => setAgree(e.target.checked)}
                                    className="mt-1 h-4 w-4 shrink-0 accent-[#ffb02e]"
                                />
                                <span className="text-sm leading-relaxed text-fog">
                                    <strong className="text-white">I agree to the cancellation policy.</strong> {CANCELLATION_POLICY}{" "}
                                    Holiday weekends and holidays may cost extra.
                                </span>
                            </label>
                            <div className="mt-5">
                                {pkg && (
                                    <Turnstile
                                        ref={turnstile}
                                        siteKey={SITE.turnstileSiteKey}
                                        action="booking"
                                        onToken={setToken}
                                        onError={() => toastError("The spam check couldn't load. Please refresh the page.")}
                                    />
                                )}
                            </div>
                        </Step>
                    </div>

                    <aside className="card p-6 lg:sticky lg:top-24" aria-label="Booking summary">
                        <h2 className="font-display text-lg font-semibold text-white">Summary</h2>
                        {!pkg ? (
                            <p className="mt-4 text-sm text-fog">Choose a package to see your total.</p>
                        ) : (
                            <>
                                <dl className="mt-4 space-y-1 text-sm">
                                    <dt className="text-xs font-semibold uppercase tracking-wider text-fog">When</dt>
                                    <dd className="font-semibold text-white">
                                        {date ? formatDate(date, { year: undefined }) : "Pick a date"}
                                        {date && time && <span className="block text-gold">{formatTime(time)}</span>}
                                    </dd>
                                </dl>
                                {priced instanceof QuoteError ? (
                                    <p className="mt-4 text-sm text-red-300">{priced.message}</p>
                                ) : (
                                    priced && (
                                        <>
                                            <ul className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
                                                {priced.lines.map((l) => (
                                                    <li key={l.label} className="flex justify-between gap-3">
                                                        <span className="text-white/85">{l.label}</span>
                                                        <span className="shrink-0 text-white">{formatPrice(l.amount)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                                                <p className="flex justify-between font-semibold text-white">
                                                    <span>Total</span>
                                                    <span>{formatPrice(priced.total)}</span>
                                                </p>
                                                <p className="flex justify-between text-fog">
                                                    <span>Due at the party</span>
                                                    <span>{formatPrice(priced.balance)}</span>
                                                </p>
                                                <p className="flex justify-between rounded-xl bg-gold/10 px-3 py-2.5 font-display text-base font-semibold text-gold">
                                                    <span>Deposit today</span>
                                                    <span>{formatPrice(priced.deposit)}</span>
                                                </p>
                                            </div>
                                        </>
                                    )
                                )}
                            </>
                        )}
                        <button type="submit" className="btn-gold mt-6 w-full py-4!" disabled={!ready || submitting}>
                            <MdLock size={18} aria-hidden />
                            {submitting ? "Opening secure checkout…" : ready ? `Pay ${formatPrice(ready.deposit)} deposit` : "Pay deposit"}
                        </button>
                        <p className="mt-3 text-center text-xs text-fog">Secure payment by Stripe. We confirm every booking by email.</p>
                        <a href={SITE.phoneHref} className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-white hover:text-gold">
                            <MdPhone className="text-gold" size={16} aria-hidden /> Rather book by phone? {SITE.phone}
                        </a>
                    </aside>
                </form>
            </div>
        </div>
    );
}

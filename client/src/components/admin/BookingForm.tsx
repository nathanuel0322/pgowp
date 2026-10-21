import { useMemo, useState } from "react";
import { addOnsFor, findPackage, quote, QuoteError } from "../../booking/quote";
import type { BookingRow } from "../../booking/server";
import { todayInZone, utcToZoned } from "../../booking/time";
import { MAX_EXTRA_HOURS, PARTY_PACKAGES, formatPrice } from "../../data/packages";

export const adminField =
    "w-full rounded-lg border border-line bg-ink/60 px-3 py-2.5 text-[15px] text-white placeholder:text-fog/60 focus:border-gold/60 focus:outline-hidden focus:ring-2 focus:ring-gold/20";

export interface BookingFormValues {
    packageId: string;
    date: string;
    time: string;
    guests: number;
    extraHours: number;
    addOns: string[];
    name: string;
    email: string;
    phone: string;
    address: string;
    guestOfHonor: string;
    notes: string;
    adminNotes: string;
    paid: number;
    notify: boolean;
}

function initialValues(b?: BookingRow): BookingFormValues {
    if (!b)
        return {
            packageId: PARTY_PACKAGES[1].id,
            date: todayInZone(Date.now()),
            time: "12:00",
            guests: 15,
            extraHours: 0,
            addOns: [],
            name: "",
            email: "",
            phone: "",
            address: "",
            guestOfHonor: "",
            notes: "",
            adminNotes: "",
            paid: 0,
            notify: false,
        };
    const start = utcToZoned(Date.parse(b.start_at));
    return {
        packageId: b.package_id,
        date: start.date,
        time: start.time,
        guests: b.guests,
        extraHours: b.extra_hours,
        addOns: b.add_ons,
        name: b.customer_name,
        email: b.customer_email ?? "",
        phone: b.customer_phone ?? "",
        address: b.address ?? "",
        guestOfHonor: b.guest_of_honor ?? "",
        notes: b.notes ?? "",
        adminNotes: b.admin_notes ?? "",
        paid: Number(b.paid),
        notify: false,
    };
}

// Adds a booking taken over the phone (or copied over from 10to8), or edits an existing one.
export default function BookingForm({
    booking,
    onSave,
    onClose,
}: {
    booking?: BookingRow;
    onSave(values: BookingFormValues): Promise<void>;
    onClose(): void;
}) {
    const [v, setV] = useState(() => initialValues(booking));
    const [saving, setSaving] = useState(false);
    const pkg = findPackage(v.packageId);
    const set = <K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) => setV((p) => ({ ...p, [key]: value }));
    const input = (key: "name" | "email" | "phone" | "address" | "guestOfHonor" | "notes" | "adminNotes") => ({
        value: v[key],
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value),
    });

    const priced = useMemo(() => {
        try {
            return quote({ packageId: v.packageId, addOns: v.addOns, extraHours: v.extraHours, guests: v.guests });
        } catch (error) {
            if (error instanceof QuoteError) return error;
            throw error;
        }
    }, [v.packageId, v.addOns, v.extraHours, v.guests]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(v);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <form onSubmit={submit} className="mx-auto my-8 max-w-2xl rounded-3xl border border-line bg-surface p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="font-display text-xl font-semibold text-white">{booking ? "Edit booking" : "Add a booking"}</h2>
                    <button type="button" onClick={onClose} className="text-sm font-semibold text-fog hover:text-white">
                        Close
                    </button>
                </div>
                {!booking && (
                    <p className="mt-2 text-sm text-fog">
                        For phone bookings and parties moved over from 10to8. It's saved as confirmed and no card is charged.
                    </p>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                        <span className="text-sm font-semibold text-white">Package</span>
                        <select
                            value={v.packageId}
                            onChange={(e) => {
                                const next = findPackage(e.target.value)!;
                                setV((p) => ({
                                    ...p,
                                    packageId: next.id,
                                    addOns: p.addOns.filter((id) => addOnsFor(next).some((a) => a.id === id)),
                                }));
                            }}
                            className={`${adminField} mt-1.5`}
                        >
                            {PARTY_PACKAGES.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({formatPrice(p.price)})
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Date</span>
                        <input required type="date" value={v.date} onChange={(e) => set("date", e.target.value)} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Start time</span>
                        <input required type="time" value={v.time} onChange={(e) => set("time", e.target.value)} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Guests</span>
                        <input
                            required
                            type="number"
                            min={1}
                            max={pkg?.maxGuests}
                            value={v.guests || ""}
                            onChange={(e) => set("guests", Math.max(0, Math.floor(Number(e.target.value))))}
                            className={`${adminField} mt-1.5`}
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Extra hours</span>
                        <select value={v.extraHours} onChange={(e) => set("extraHours", Number(e.target.value))} className={`${adminField} mt-1.5`}>
                            {Array.from({ length: MAX_EXTRA_HOURS + 1 }, (_, h) => (
                                <option key={h} value={h}>
                                    {h ? `+${h} hour${h === 1 ? "" : "s"}` : "None"}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {pkg && (
                    <fieldset className="mt-5">
                        <legend className="text-sm font-semibold text-white">Add-ons</legend>
                        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                            {addOnsFor(pkg).map((a) => (
                                <label key={a.id} className="flex items-center gap-2 text-sm text-white/85">
                                    <input
                                        type="checkbox"
                                        checked={v.addOns.includes(a.id)}
                                        onChange={(e) =>
                                            set("addOns", e.target.checked ? [...v.addOns, a.id] : v.addOns.filter((x) => x !== a.id))
                                        }
                                        className="h-4 w-4 accent-[#ffb02e]"
                                    />
                                    {a.name}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Customer name</span>
                        <input required {...input("name")} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Phone</span>
                        <input type="tel" {...input("phone")} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Email</span>
                        <input type="email" {...input("email")} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Guest of honor</span>
                        <input {...input("guestOfHonor")} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block sm:col-span-2">
                        <span className="text-sm font-semibold text-white">Party address</span>
                        <input {...input("address")} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block sm:col-span-2">
                        <span className="text-sm font-semibold text-white">Customer's notes</span>
                        <textarea rows={2} {...input("notes")} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block sm:col-span-2">
                        <span className="text-sm font-semibold text-white">Private notes (only you see these)</span>
                        <textarea rows={2} {...input("adminNotes")} className={`${adminField} mt-1.5`} />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold text-white">Paid so far ($)</span>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={v.paid}
                            onChange={(e) => set("paid", Math.max(0, Number(e.target.value)))}
                            className={`${adminField} mt-1.5`}
                        />
                    </label>
                    <div className="self-end text-sm">
                        {priced instanceof QuoteError ? (
                            <p className="text-red-300">{priced.message}</p>
                        ) : (
                            <p className="text-fog">
                                Total <strong className="text-white">{formatPrice(priced.total)}</strong> · Due at party{" "}
                                <strong className="text-white">{formatPrice(Math.max(0, priced.total - v.paid))}</strong>
                            </p>
                        )}
                    </div>
                </div>

                <label className="mt-5 flex items-center gap-2 text-sm text-white/85">
                    <input type="checkbox" checked={v.notify} onChange={(e) => set("notify", e.target.checked)} className="h-4 w-4 accent-[#ffb02e]" />
                    {booking ? "Email the customer if the date or time changed" : "Email the customer a confirmation"}
                </label>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className="btn-ghost">
                        Cancel
                    </button>
                    <button type="submit" className="btn-gold" disabled={saving || priced instanceof QuoteError}>
                        {saving ? "Saving…" : booking ? "Save changes" : "Add booking"}
                    </button>
                </div>
            </form>
        </div>
    );
}

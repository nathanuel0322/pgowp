import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MdCheckCircle, MdHourglassTop, MdPhone } from "react-icons/md";
import { apilink } from "../GlobalFunctions";
import { formatPrice } from "../data/packages";
import { formatDate, formatTime, type PricedLine } from "../lib/booking";
import { SITE } from "../site";

interface ConfirmedBooking {
    status: "pending" | "confirmed" | "cancelled" | "expired";
    package_name: string;
    add_ons: PricedLine[];
    date: string;
    time: string;
    end_time: string;
    customer_name: string;
    customer_email: string;
    address: string;
    total_cents: number;
    deposit_cents: number;
    paid_cents: number;
}

// Where Stripe sends the customer after paying. The worker double-checks the payment with Stripe before this page
// says "booked", in case the webhook hasn't arrived yet.
export default function BookingConfirmed() {
    const [params] = useSearchParams();
    const sessionId = params.get("session_id") ?? "";
    const [booking, setBooking] = useState<ConfirmedBooking | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        let attempts = 0;
        const load = async () => {
            try {
                const res = await fetch(`${apilink}/booking/status?session_id=${encodeURIComponent(sessionId)}`);
                const json = await res.json().catch(() => null);
                if (cancelled) return;
                if (!res.ok) return setError(json?.message ?? "We couldn't find that booking.");
                setBooking(json.booking);
                // Card payments settle right away, but give a slow one a few more tries.
                if (json.booking.status === "pending" && ++attempts < 6) setTimeout(load, 3000);
                else if (json.booking.status === "confirmed") sessionStorage.removeItem("booking-draft");
            } catch {
                if (!cancelled) setError("We couldn't load your booking. Your payment is safe; please call us to confirm.");
            }
        };
        if (sessionId) load();
        else setError("Missing booking reference.");
        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    const confirmed = booking?.status === "confirmed";

    return (
        <section className="relative overflow-clip pb-8 pt-32 lg:pt-40">
            <div aria-hidden className="glow-gold absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2" />
            <div className="wrap relative max-w-2xl">
                <div className="card p-8 text-center sm:p-12">
                    {error ? (
                        <>
                            <h1 className="h-display text-3xl">Something's not right</h1>
                            <p className="mt-4 text-fog">{error}</p>
                        </>
                    ) : !booking ? (
                        <p className="text-fog" role="status">
                            Checking your booking...
                        </p>
                    ) : confirmed ? (
                        <>
                            <MdCheckCircle className="mx-auto text-gold" size={60} aria-hidden />
                            <h1 className="h-display mt-6 text-3xl sm:text-4xl">You're booked!</h1>
                            <p className="mt-4 text-fog">
                                Thanks, {booking.customer_name.split(" ")[0]}. A confirmation is on its way to{" "}
                                <strong className="text-white">{booking.customer_email}</strong>.
                            </p>
                        </>
                    ) : booking.status === "pending" ? (
                        <>
                            <MdHourglassTop className="mx-auto text-gold" size={56} aria-hidden />
                            <h1 className="h-display mt-6 text-3xl">Finishing up your payment</h1>
                            <p className="mt-4 text-fog">
                                This usually takes a few seconds. If it doesn't update, call us and we'll confirm it for you.
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="h-display text-3xl">This booking wasn't completed</h1>
                            <p className="mt-4 text-fog">The payment didn't go through or the hold ran out.</p>
                            <Link to="/book" className="btn-gold mt-6">
                                Start again
                            </Link>
                        </>
                    )}

                    {booking && (confirmed || booking.status === "pending") && (
                        <dl className="mt-8 space-y-3 border-t border-line pt-6 text-left text-sm">
                            <Row label="Party" value={booking.package_name} />
                            <Row
                                label="When"
                                value={`${formatDate(booking.date)}, ${formatTime(booking.time)} to ${formatTime(booking.end_time)}`}
                            />
                            <Row label="Where" value={booking.address} />
                            {booking.add_ons.length > 0 && (
                                <Row
                                    label="Add-ons"
                                    value={booking.add_ons.map((a) => (a.qty > 1 ? `${a.name} × ${a.qty}` : a.name)).join(", ")}
                                />
                            )}
                            <Row label="Deposit paid" value={formatPrice(booking.paid_cents / 100)} />
                            <Row label="Due on the day" value={formatPrice((booking.total_cents - booking.paid_cents) / 100)} />
                        </dl>
                    )}

                    <a href={SITE.phoneHref} className="btn-ghost mt-8">
                        <MdPhone size={18} aria-hidden /> {SITE.phone}
                    </a>
                </div>
            </div>
        </section>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[110px_1fr] gap-3">
            <dt className="text-fog">{label}</dt>
            <dd className="text-white">{value}</dd>
        </div>
    );
}

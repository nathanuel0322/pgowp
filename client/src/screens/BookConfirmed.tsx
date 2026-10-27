import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MdCheckCircle, MdPhone } from "react-icons/md";
import { formatPrice } from "../data/packages";
import { apilink } from "../GlobalFunctions";
import { SITE } from "../site";

interface Confirmation {
    status: string;
    firstName: string;
    email: string | null;
    packageName: string;
    when: string;
    paid: number;
    balance: number;
}

// Where Stripe sends customers after paying the deposit. Asking the server here also records the payment,
// in case Stripe's own notification hasn't arrived yet.
export default function BookConfirmed() {
    const [params] = useSearchParams();
    const sessionId = params.get("session_id");
    const [booking, setBooking] = useState<Confirmation | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return setError("This link is missing its booking details.");
        let cancelled = false;
        let tries = 0;
        const check = async () => {
            try {
                const res = await fetch(`${apilink}/booking/confirm?session_id=${encodeURIComponent(sessionId)}`);
                const body = await res.json();
                if (cancelled) return;
                if (!res.ok) return setError(body.message ?? "We couldn't find that booking.");
                // Card payments settle right away; anything slower gets a few more looks.
                if (body.status === "hold" && ++tries < 6) {
                    setTimeout(check, 2500);
                    return;
                }
                setBooking(body);
            } catch {
                if (!cancelled) setError("We couldn't reach the booking system.");
            }
        };
        check();
        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    const received = booking && booking.status !== "hold";

    return (
        <section className="relative overflow-hidden pb-16 pt-32 lg:pt-40">
            <div aria-hidden className="grid-bg absolute inset-0 opacity-60" />
            <div aria-hidden className="glow-gold absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2" />
            <div className="wrap relative">
                <div className="card mx-auto max-w-xl p-8 text-center sm:p-10">
                    {error ? (
                        <>
                            <h1 className="h-display text-3xl">Hmm, something's off</h1>
                            <p className="lede mt-4">{error} If you were charged, don't worry: give us a call, and we'll sort it out.</p>
                        </>
                    ) : !booking ? (
                        <>
                            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gold/20 border-t-gold" />
                            <p className="lede mt-6">Checking your payment…</p>
                        </>
                    ) : received ? (
                        <>
                            <MdCheckCircle className="mx-auto text-gold" size={64} aria-hidden />
                            <h1 className="h-display mt-4 text-3xl sm:text-4xl">Thanks, {booking.firstName}!</h1>
                            <p className="lede mt-4">
                                Your {formatPrice(booking.paid)} deposit went through, and your time is on hold. We'll look it over and
                                email {booking.email ? <strong className="text-white">{booking.email}</strong> : "you"} to confirm.
                            </p>
                            <dl className="mt-8 space-y-3 rounded-2xl border border-line bg-ink/40 p-5 text-left text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-fog">Party</dt>
                                    <dd className="text-right font-semibold text-white">{booking.packageName}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-fog">When</dt>
                                    <dd className="text-right font-semibold text-white">{booking.when}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-fog">Due at the party</dt>
                                    <dd className="text-right font-semibold text-white">{formatPrice(booking.balance)}</dd>
                                </div>
                            </dl>
                        </>
                    ) : (
                        <>
                            <h1 className="h-display text-3xl">Payment still processing</h1>
                            <p className="lede mt-4">
                                Stripe hasn't told us your payment went through yet. You'll get an email as soon as it does.
                            </p>
                        </>
                    )}
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link to="/" className="btn-ghost">
                            Back to home
                        </Link>
                        <a href={SITE.phoneHref} className="btn-gold">
                            <MdPhone size={18} aria-hidden /> {SITE.phone}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

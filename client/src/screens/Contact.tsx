import { useRef, useState } from "react";
import { MdEmail, MdPhone, MdCheckCircle } from "react-icons/md";
import { FaInstagram } from "react-icons/fa6";
import { apilink, toastError } from "../GlobalFunctions";
import { PageHero } from "../components/ui";
import { BookButton } from "../components/global/Header";
import Turnstile, { TurnstileHandle } from "../components/Turnstile";
import { SERVICE_AREAS, SITE } from "../site";

const field =
    "w-full rounded-xl border border-line bg-ink/60 px-4 py-3.5 text-[15px] text-white placeholder:text-fog/60 transition focus:border-gold/60 focus:outline-hidden focus:ring-2 focus:ring-gold/20";

export default function Contact() {
    const [formfilled, setFormfilled] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const turnstile = useRef<TurnstileHandle>(null);

    const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const from_name = String(data.get("from_name") ?? "").trim();
        const user_email = String(data.get("user_email") ?? "").trim();
        const phone = String(data.get("phone") ?? "").trim();
        const eventDate = String(data.get("event_date") ?? "").trim();
        const body = String(data.get("message") ?? "").trim();
        if (!from_name || !user_email || !body) return toastError("Please fill out your name, email and message.");
        if (!token) return toastError("Please wait a moment for the spam check to finish, then try again.");

        const extras = [phone && `Phone: ${phone}`, eventDate && `Event date: ${eventDate}`].filter(Boolean);
        const message = extras.length ? `${body}\n\n— ${extras.join(" | ")}` : body;

        setSubmitting(true);
        try {
            const res = await fetch(apilink + "/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ from_name, user_email, message, turnstile_token: token }),
            });
            if (res.status !== 204) {
                const json = await res.json().catch(() => null);
                toastError(json?.message ?? "Couldn't send your message. Please call us instead.");
                // Each spam-check token works only once, so get a fresh one for the next try.
                turnstile.current?.reset();
            } else setFormfilled(true);
        } catch (error: unknown) {
            console.error("Error sending email:", error);
            toastError("Error sending email, please try again later.");
            turnstile.current?.reset();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <PageHero
                eyebrow="Contact"
                title={
                    <>
                        Let's plan your <span className="text-gradient">game truck party</span>
                    </>
                }
                lede="Call or send a message, and we'll get back to you as soon as possible. Weekends fill up quickly, so reach out early."
            />

            <section className="wrap">
                <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                    <div className="space-y-4">
                        <a
                            href={SITE.phoneHref}
                            className="card group flex items-center gap-5 p-6 transition hover:border-gold/40"
                        >
                            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold text-ink">
                                <MdPhone size={26} aria-hidden />
                            </span>
                            <span>
                                <span className="block text-xs font-semibold uppercase tracking-wider text-fog">
                                    Call us
                                </span>
                                <span className="font-display text-xl font-semibold text-white group-hover:text-gold">
                                    {SITE.phone}
                                </span>
                            </span>
                        </a>
                        <a
                            href={`mailto:${SITE.email}`}
                            className="card group flex items-center gap-5 p-6 transition hover:border-gold/40"
                        >
                            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/6 text-gold ring-1 ring-line">
                                <MdEmail size={24} aria-hidden />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-fog">
                                    Email
                                </span>
                                <span className="block break-all font-semibold text-white group-hover:text-gold">
                                    {SITE.email}
                                </span>
                            </span>
                        </a>
                        <a
                            href={SITE.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card group flex items-center gap-5 p-6 transition hover:border-gold/40"
                        >
                            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/6 text-gold ring-1 ring-line">
                                <FaInstagram size={22} aria-hidden />
                            </span>
                            <span>
                                <span className="block text-xs font-semibold uppercase tracking-wider text-fog">
                                    Instagram
                                </span>
                                <span className="font-semibold text-white group-hover:text-gold">
                                    @prestigiousgamingonwheelsplus
                                </span>
                            </span>
                        </a>
                        <div className="card p-6">
                            <h2 className="font-display text-base font-semibold text-white">Service area</h2>
                            <p className="mt-2 text-sm leading-relaxed text-fog">
                                <strong className="text-white">{SERVICE_AREAS.standard.join(", ")}</strong>, plus{" "}
                                {SERVICE_AREAS.surcharge.join(", ")} for an additional travel surcharge.
                            </p>
                            <BookButton className="btn-gold mt-5" label="Book online" />
                        </div>
                    </div>

                    <div className="card relative overflow-hidden p-6 sm:p-10">
                        <div aria-hidden className="glow-gold absolute -right-32 -top-32 h-80 w-80 opacity-70" />
                        {formfilled ? (
                            <div className="relative flex min-h-[420px] flex-col items-center justify-center text-center">
                                <MdCheckCircle className="text-gold" size={56} aria-hidden />
                                <h2 className="h-display mt-6 text-3xl">Message sent!</h2>
                                <p className="mt-3 text-fog">Thank you. We'll get back to you as soon as possible.</p>
                            </div>
                        ) : (
                            <form className="relative grid gap-5" onSubmit={sendEmail}>
                                <h2 className="h-display text-2xl">Send us a message</h2>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="grid gap-2 text-sm font-semibold text-white/85">
                                        Name *
                                        <input name="from_name" required autoComplete="name" className={field} />
                                    </label>
                                    <label className="grid gap-2 text-sm font-semibold text-white/85">
                                        Email *
                                        <input
                                            name="user_email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            className={field}
                                        />
                                    </label>
                                    <label className="grid gap-2 text-sm font-semibold text-white/85">
                                        Phone
                                        <input name="phone" type="tel" autoComplete="tel" className={field} />
                                    </label>
                                    <label className="grid gap-2 text-sm font-semibold text-white/85">
                                        Event date
                                        <input name="event_date" type="date" className={`${field} scheme-dark`} />
                                    </label>
                                </div>
                                <label className="grid gap-2 text-sm font-semibold text-white/85">
                                    Message *
                                    <textarea
                                        name="message"
                                        required
                                        rows={6}
                                        placeholder="Tell us about your party: location, number of guests, package you're interested in..."
                                        className={`${field} resize-y`}
                                    />
                                </label>
                                <Turnstile
                                    ref={turnstile}
                                    siteKey={SITE.turnstileSiteKey}
                                    action="contact"
                                    onToken={setToken}
                                    onError={() =>
                                        toastError("The spam check couldn't load. Refresh the page or call us instead.")
                                    }
                                />
                                <button type="submit" className="btn-gold w-full py-4! sm:w-fit" disabled={submitting}>
                                    {submitting ? "Sending..." : "Send message"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

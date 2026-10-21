import { MdCheck, MdPhone } from "react-icons/md";
import { BookButton } from "../components/global/Header";
import { CtaBand, PageHero, SectionHeading } from "../components/ui";
import { ADD_ON_GROUPS, GROUP_EVENTS, PARTY_PACKAGES, formatPrice } from "../data/packages";
import { SITE } from "../site";

export default function Packages() {
    return (
        <>
            <PageHero
                eyebrow="Packages & pricing"
                title={
                    <>
                        Game truck party <span className="text-gradient">packages & prices</span>
                    </>
                }
                lede="Transparent pricing for video game, laser tag and movie parties anywhere in Queens, Brooklyn and Nassau County. A deposit locks in your date and the balance is due when we arrive."
            />

            <section className="wrap" aria-label="Party packages">
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {PARTY_PACKAGES.map((p) => (
                        <article
                            key={p.id}
                            id={p.id}
                            className={`relative flex flex-col rounded-3xl border p-8 ${
                                p.featured
                                    ? "border-gold/50 bg-linear-to-b from-gold/12 to-surface shadow-[0_30px_80px_-30px_rgba(255,176,46,0.45)]"
                                    : "border-line bg-surface"
                            }`}
                        >
                            {p.featured && (
                                <span className="absolute -top-3 left-8 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">
                                    Most booked
                                </span>
                            )}
                            <h2 className="font-display text-lg font-semibold text-white">{p.name}</h2>
                            <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                                <span className="font-display text-[2.6rem] font-bold leading-none text-white xl:text-5xl">{formatPrice(p.price)}</span>
                                <span className="text-sm text-fog">/ {p.duration}</span>
                            </p>
                            <p className="mt-4 text-[15px] leading-relaxed text-fog">{p.blurb}</p>
                            <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-6 text-sm">
                                {p.features.map((f) => (
                                    <li key={f} className="flex gap-3 text-white/85">
                                        <MdCheck className="mt-0.5 shrink-0 text-gold" size={18} aria-hidden />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <BookButton
                                className={`${p.featured ? "btn-gold" : "btn-ghost"} mt-8 w-full`}
                                label="Book this party"
                                service={p.bookingService}
                            />
                        </article>
                    ))}
                </div>
                <div className="mt-8 grid gap-4 rounded-2xl border border-line bg-surface/60 p-6 text-sm text-fog sm:grid-cols-3">
                    <p>
                        <strong className="text-white">50% deposit</strong> reserves gaming and movie parties ($200 for a
                        stand-alone laser tag party).
                    </p>
                    <p>
                        <strong className="text-white">Need more time?</strong> Add extra hours for $150 each, before
                        or during the party, when available.
                    </p>
                    <p>
                        <strong className="text-white">Parties over 4 hours</strong> get a complimentary PLUS item after
                        game time.
                    </p>
                </div>
            </section>

            <section className="wrap mt-28">
                <SectionHeading
                    eyebrow="Make it PLUS"
                    title="Add-ons & extras"
                    lede="Stack any of these onto your party. Prices are per party unless noted."
                />
                <div className="mt-12 grid gap-5 md:grid-cols-2">
                    {ADD_ON_GROUPS.map((group) => (
                        <div key={group.title} className="card p-7 sm:p-8">
                            <h3 className="font-display text-lg font-semibold text-white">{group.title}</h3>
                            <ul className="mt-5 divide-y divide-line">
                                {group.items.map((item) => (
                                    <li key={item.name} className="flex items-baseline justify-between gap-4 py-3.5">
                                        <span>
                                            <span className="font-semibold text-white/90">{item.name}</span>
                                            {item.note && <span className="block text-xs text-fog">{item.note}</span>}
                                        </span>
                                        <span className="shrink-0 font-display font-semibold text-gold">
                                            {item.price === null ? "Call" : formatPrice(item.price)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            <section className="wrap mt-28">
                <div className="card relative overflow-hidden p-8 sm:p-12">
                    <div aria-hidden className="glow-volt absolute -right-20 -top-24 h-80 w-80" />
                    <div className="relative grid gap-10 lg:grid-cols-[1fr_1.4fr]">
                        <div>
                            <p className="eyebrow">Groups</p>
                            <h2 className="h-display mt-4 text-3xl">Schools, churches & corporate events</h2>
                            <p className="mt-4 text-[15px] leading-relaxed text-fog">
                                Rotations for whole grades, fun days, fundraisers and team events. Pricing depends on
                                hours and headcount, so give us a call for a custom quote.
                            </p>
                            <a href={SITE.phoneHref} className="btn-gold mt-7">
                                <MdPhone size={18} aria-hidden /> Get a quote: {SITE.phone}
                            </a>
                        </div>
                        <ul className="grid gap-3 sm:grid-cols-2">
                            {GROUP_EVENTS.map((g) => (
                                <li key={g.name} className="rounded-2xl border border-line bg-ink/40 p-5">
                                    <h3 className="font-bold text-white">{g.name}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-fog">{g.detail}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <CtaBand />
        </>
    );
}

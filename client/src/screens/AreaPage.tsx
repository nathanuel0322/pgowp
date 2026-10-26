import { Link } from "react-router-dom";
import { MdArrowForward, MdLocationOn, MdPhone } from "react-icons/md";
import { BookButton } from "../components/global/Header";
import { CtaBand, Img, PageHero, SectionHeading } from "../components/ui";
import FaqList from "../components/FaqList";
import Reviews from "../components/home/Reviews";
import { Area, AREAS } from "../data/areas";
import { FAQS } from "../data/faq";
import { formatPrice } from "../data/packages";
import { useCatalog } from "../lib/catalogStore";
import { photo } from "../data/photos";
import { SERVICE_AREAS, SITE } from "../site";

export default function AreaPage({ area }: { area: Area }) {
    const others = AREAS.filter((a) => a.slug !== area.slug);
    const rain = FAQS.find((f) => /rain/.test(f.question));
    const { packages } = useCatalog();

    return (
        <>
            <PageHero
                eyebrow={`${area.name} · Game truck parties`}
                title={<span className="text-gradient">{area.heading}</span>}
                lede={area.lede}
            />

            <section className="wrap">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                    <div>
                        {area.intro.map((p) => (
                            <p key={p.slice(0, 24)} className="mb-5 text-[17px] leading-relaxed text-white/85">
                                {p}
                            </p>
                        ))}
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <BookButton className="btn-gold !px-8 !py-4" label="Check availability" />
                            <a href={SITE.phoneHref} className="btn-ghost !px-8 !py-4">
                                <MdPhone size={18} aria-hidden /> {SITE.phone}
                            </a>
                        </div>
                    </div>
                    <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-line">
                        <Img photo={photo(area.photo)} priority />
                    </div>
                </div>
            </section>

            <section className="wrap mt-24">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <SectionHeading
                        eyebrow="Packages"
                        title={`${area.name} party prices`}
                        lede="Every gaming party includes game coaches, wristbands for all guests and a free T-shirt + gift for the guest of honor."
                    />
                    <Link to="/packages" className="btn-ghost">
                        All packages & add-ons <MdArrowForward aria-hidden />
                    </Link>
                </div>
                <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {packages.map((p) => (
                        <li key={p.id} className="card flex items-baseline justify-between gap-4 p-6">
                            <span>
                                <span className="block font-display font-semibold text-white">{p.name}</span>
                                <span className="text-sm text-fog">{p.duration}</span>
                            </span>
                            <span className="font-display text-2xl font-bold text-gold">{formatPrice(p.price)}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <Reviews className="mt-24" />

            <section className="wrap mt-24">
                <div className="card relative overflow-hidden p-8 sm:p-10">
                    <div aria-hidden className="glow-volt absolute -right-20 -top-20 h-72 w-72" />
                    <h2 className="h-display relative text-2xl sm:text-3xl">Where we party in {area.name}</h2>
                    <ul className="relative mt-6 flex flex-wrap gap-2">
                        {area.places.map((place) => (
                            <li
                                key={place}
                                className="flex items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/85"
                            >
                                <MdLocationOn className="text-gold" aria-hidden /> {place}
                            </li>
                        ))}
                    </ul>
                    <p className="relative mt-6 text-[15px] text-fog">{area.placesNote}</p>
                </div>
            </section>

            <section className="wrap mt-24">
                <SectionHeading eyebrow="Planning tips" title={`Hosting in ${area.name}`} />
                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {area.tips.map((t) => (
                        <div key={t.title} className="card p-7">
                            <h3 className="font-display text-lg font-semibold text-white">{t.title}</h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-fog">{t.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="wrap mt-24">
                <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
                    <div>
                        <SectionHeading eyebrow="Good to know" title={`${area.name} party FAQ`} />
                        <Link
                            to="/about"
                            className="mt-8 inline-flex items-center gap-2 font-semibold text-gold hover:text-gold-soft"
                        >
                            Read all FAQs <MdArrowForward aria-hidden />
                        </Link>
                    </div>
                    <FaqList faqs={rain ? [...area.faqs, rain] : area.faqs} />
                </div>
            </section>

            <section className="wrap mt-24">
                <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    We also serve
                </h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                    {others.map((a) => (
                        <li key={a.slug}>
                            <Link
                                to={a.path}
                                className="inline-block rounded-full bg-gold px-4 py-2 text-sm font-bold text-ink transition hover:bg-gold-soft"
                            >
                                {a.name}
                            </Link>
                        </li>
                    ))}
                    {SERVICE_AREAS.surcharge.map((name) => (
                        <li key={name} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-white/85">
                            {name}
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-sm text-fog">Areas with an outline add a travel surcharge.</p>
            </section>

            <CtaBand title={`Ready to book your ${area.name} party?`} />
        </>
    );
}

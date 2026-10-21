import { Link } from "react-router-dom";
import { MdPhone, MdCheck, MdArrowForward } from "react-icons/md";
import { SiPlaystation5, SiXbox, SiNintendoswitch, SiOculus, SiEpicgames } from "react-icons/si";
import { GiPartyPopper, GiLaserBlast, GiPopcorn, GiMicrophone, GiJoystick, GiPhotoCamera } from "react-icons/gi";
import { BsCloudRainHeavy, BsPeople, BsTruck, BsController, BsTv, BsJoystick } from "react-icons/bs";
import { BookButton } from "../components/global/Header";
import { CtaBand, Img, SectionHeading } from "../components/ui";
import LiteYouTube from "../components/home/LiteYouTube";
import Reviews from "../components/home/Reviews";
import FaqList from "../components/FaqList";
import { GALLERY, photo } from "../data/photos";
import { PARTY_PACKAGES, formatPrice } from "../data/packages";
import { FAQS } from "../data/faq";
import { AREAS } from "../data/areas";
import { EVENT_TYPES, SERVICE_AREAS, SITE } from "../site";

const hero = photo("trailer-night-glow");

const LINEUP = [
    { icon: SiPlaystation5, label: "PlayStation 5" },
    { icon: SiXbox, label: "Xbox Series X" },
    { icon: SiNintendoswitch, label: "Nintendo Switch" },
    { icon: SiOculus, label: "Virtual Reality" },
    { icon: SiEpicgames, label: "Fortnite included" },
    { icon: GiLaserBlast, label: "Live-scored laser tag" },
    { icon: GiJoystick, label: "1,000+ retro arcade games" },
    { icon: GiMicrophone, label: "Karaoke" },
    { icon: GiPhotoCamera, label: "Photobooth" },
    { icon: GiPopcorn, label: "Popcorn & cotton candy" },
];

const STATS = [
    { value: "28", label: "gamers at once" },
    { value: "9", label: "4K HD screens" },
    { value: "1,000+", label: "retro classics" },
    { value: "100%", label: "climate controlled" },
];

const FEATURES = [
    {
        icon: BsTv,
        title: "A theater on wheels",
        text: "Seven indoor 4K TVs with soundbars, two outdoor screens under a 14-foot awning and LED lighting that makes every photo pop.",
    },
    {
        icon: BsPeople,
        title: "Up to 28 gamers at once",
        text: "Big enough for the whole class. Everyone plays at the same time, so nobody waits around for a turn.",
    },
    {
        icon: BsCloudRainHeavy,
        title: "Rain or shine",
        text: "Heat in the winter, A/C in the summer. The party goes on in any weather.",
    },
    {
        icon: BsController,
        title: "Game coaches included",
        text: "Our staff helps pick games, switch titles, teach new players and keep the fun going all party long.",
    },
    {
        icon: GiJoystick,
        title: "Retro for the grown-ups",
        text: "While the kids battle on today's consoles, parents can relive Pac-Man, Donkey Kong and 1,000+ arcade classics.",
    },
    {
        icon: BsTruck,
        title: "We come to you",
        text: "Your driveway, your block, your school parking lot. Just save us about 5 car lengths and we set up everything.",
    },
];

const STEPS = [
    {
        title: "Pick your package",
        text: "Choose a gaming, laser tag or movie party and stack on add-ons like VR, karaoke or cotton candy.",
    },
    {
        title: "Lock in your date",
        text: "A 50% deposit reserves your time slot. The balance is due when we arrive.",
    },
    {
        title: "We pull up. You party.",
        text: "Save us 5 car lengths of parking. We set up, run the games and leave you with the memories.",
    },
];

export default function Home() {
    const featured = PARTY_PACKAGES.slice(0, 3);

    return (
        <>
            {/* Hero */}
            <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-14 pt-28 sm:items-center sm:pb-20">
                <div className="absolute inset-0 -z-10">
                    <Img photo={hero} priority sizes="100vw" className="object-[70%_50%] opacity-70 sm:opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10 sm:bg-gradient-to-r sm:from-ink sm:via-ink/75 sm:to-ink/10" />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
                </div>
                <div aria-hidden className="glow-volt absolute -left-40 top-1/4 -z-10 h-[520px] w-[520px] opacity-70" />

                <div className="wrap">
                    <div className="max-w-2xl animate-rise">
                        <p className="eyebrow">Queens · Brooklyn · Long Island</p>
                        <h1 className="h-display mt-5 text-[2.5rem] sm:text-6xl lg:text-7xl">
                            Video game truck parties, <span className="text-gradient">delivered to your door.</span>
                        </h1>
                        <p className="lede mt-6 max-w-xl">
                            A luxury, climate-controlled gaming theater on wheels with PS5, Xbox Series X, Nintendo
                            Switch, VR and live-scored laser tag. The ultimate birthday, school or block party in NYC and
                            Long Island.
                        </p>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <BookButton className="btn-gold !px-8 !py-4 text-base" label="Check availability" />
                            <Link to="/packages" className="btn-ghost !px-8 !py-4 text-base">
                                See packages & prices
                            </Link>
                        </div>
                        <a
                            href={SITE.phoneHref}
                            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-fog hover:text-white"
                        >
                            <MdPhone className="text-gold" aria-hidden /> Prefer to talk? Call {SITE.phone}
                        </a>
                    </div>

                    <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
                        {STATS.map((s) => (
                            <div key={s.label} className="bg-ink/70 px-5 py-4 backdrop-blur">
                                <dt className="sr-only">{s.label}</dt>
                                <dd className="font-display text-2xl font-bold text-white">{s.value}</dd>
                                <dd className="mt-1 text-xs font-semibold uppercase tracking-wider text-fog">
                                    {s.label}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* Lineup marquee */}
            <section aria-label="What's on board" className="border-y border-line bg-surface/60 py-6">
                <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
                    <ul className="flex w-max animate-marquee gap-10 pr-10 hover:[animation-play-state:paused]">
                        {[...LINEUP, ...LINEUP].map((item, i) => (
                            <li
                                key={i}
                                aria-hidden={i >= LINEUP.length}
                                className="flex items-center gap-3 whitespace-nowrap text-sm font-bold uppercase tracking-wider text-white/80"
                            >
                                <item.icon size={22} className="text-gold" aria-hidden />
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Intro + features */}
            <section className="wrap mt-24 sm:mt-32">
                <div className="grid items-end gap-10 lg:grid-cols-2">
                    <SectionHeading
                        eyebrow="Hey! You found us"
                        title={
                            <>
                                Not your average <span className="text-gradient">game truck.</span>
                            </>
                        }
                    />
                    <p className="lede lg:pb-2">
                        Prestigious Gaming on Wheels Plus is a family-owned mobile gaming company from Queens. We
                        built the trailer we wished existed for our own kids: luxurious, comfortable, loud in all
                        the right ways and packed with every console worth playing.
                    </p>
                </div>

                <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="card group p-7 transition hover:border-gold/30">
                            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-gold ring-1 ring-gold/20">
                                <f.icon size={22} aria-hidden />
                            </span>
                            <h3 className="mt-6 font-display text-lg font-semibold text-white">{f.title}</h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-fog">{f.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Packages preview */}
            <section className="relative mt-28 sm:mt-36">
                <div aria-hidden className="glow-gold absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 opacity-60" />
                <div className="wrap relative">
                    <SectionHeading
                        align="center"
                        eyebrow="Packages"
                        title="Simple pricing. Epic parties."
                        lede="Every gaming party includes game coaches, wristbands for all guests and a free T-shirt + gift for the guest of honor."
                    />
                    <div className="mt-14 grid gap-5 lg:grid-cols-3">
                        {featured.map((p) => (
                            <article
                                key={p.id}
                                className={`relative flex flex-col rounded-3xl border p-8 ${
                                    p.featured
                                        ? "border-gold/50 bg-gradient-to-b from-gold/[0.12] to-surface shadow-[0_30px_80px_-30px_rgba(255,176,46,0.45)]"
                                        : "border-line bg-surface"
                                }`}
                            >
                                {p.featured && (
                                    <span className="absolute -top-3 left-8 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">
                                        Most booked
                                    </span>
                                )}
                                <h3 className="font-display text-lg font-semibold text-white">{p.name}</h3>
                                <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                                    <span className="font-display text-[2.6rem] font-bold leading-none text-white xl:text-5xl">
                                        {formatPrice(p.price)}
                                    </span>
                                    <span className="text-sm text-fog">/ {p.duration}</span>
                                </p>
                                <p className="mt-4 text-[15px] leading-relaxed text-fog">{p.blurb}</p>
                                <ul className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
                                    {p.features.slice(0, 4).map((f) => (
                                        <li key={f} className="flex gap-3 text-white/85">
                                            <MdCheck className="mt-0.5 shrink-0 text-gold" size={18} aria-hidden />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <BookButton
                                    className={`${p.featured ? "btn-gold" : "btn-ghost"} mt-8 w-full`}
                                    label="Book this party"
                                />
                            </article>
                        ))}
                    </div>
                    <div className="mt-8 text-center">
                        <Link
                            to="/packages"
                            className="inline-flex items-center gap-2 font-semibold text-gold hover:text-gold-soft"
                        >
                            Laser tag, movie parties & all add-ons <MdArrowForward aria-hidden />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Laser tag */}
            <section className="wrap mt-28 sm:mt-36">
                <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
                    <div>
                        <SectionHeading
                            eyebrow="Arena laser tag"
                            title={
                                <>
                                    Laser tag that feels like <span className="text-gradient">the pros.</span>
                                </>
                            }
                            lede="Hi-tech arena-style equipment, inflatable bunkers, live on-screen scoring, music and play-by-play commentating. Book it as a stand-alone party or add it to any gaming package."
                        />
                        <ul className="mt-8 grid gap-3 text-[15px] sm:grid-cols-2">
                            {[
                                "Up to 20 players",
                                "Live scoreboard",
                                "Set up in your yard or lot",
                                "From $22 per child as an add-on",
                            ].map((t) => (
                                <li key={t} className="flex items-center gap-3 text-white/85">
                                    <GiLaserBlast className="shrink-0 text-gold" size={20} aria-hidden />
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <LiteYouTube id="UNcke329oIc" title="Watch our live-scored laser tag in action" />
                </div>
            </section>

            {/* How it works */}
            <section className="wrap mt-28 sm:mt-36">
                <SectionHeading align="center" eyebrow="How it works" title="Booked in minutes. Remembered for years." />
                <ol className="mt-14 grid gap-5 md:grid-cols-3">
                    {STEPS.map((s, i) => (
                        <li key={s.title} className="card relative overflow-hidden p-8">
                            <span
                                aria-hidden
                                className="absolute -right-3 -top-6 font-display text-[7rem] font-extrabold leading-none text-white/[0.04]"
                            >
                                {i + 1}
                            </span>
                            <span className="font-display text-sm font-bold text-gold">Step {i + 1}</span>
                            <h3 className="mt-3 font-display text-xl font-semibold text-white">{s.title}</h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-fog">{s.text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* Gallery teaser */}
            <section className="wrap mt-28 sm:mt-36">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <SectionHeading eyebrow="Gallery" title="Real parties. Real smiles." />
                    <Link to="/gallery" className="btn-ghost">
                        View all photos <MdArrowForward aria-hidden />
                    </Link>
                </div>
                <div className="mt-12 grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-4">
                    {GALLERY.slice(0, 5).map((p, i) => (
                        <div
                            key={p.src}
                            className={`overflow-hidden rounded-2xl ${
                                i === 0 ? "col-span-2 row-span-2" : ""
                            }`}
                        >
                            <Img
                                photo={p}
                                sizes="(min-width: 768px) 25vw, 50vw"
                                className="transition duration-700 hover:scale-105"
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Events + service area */}
            <section className="wrap mt-28 sm:mt-36">
                <div className="grid gap-5 lg:grid-cols-2">
                    <div className="card p-8 sm:p-10">
                        <GiPartyPopper className="text-gold" size={32} aria-hidden />
                        <h2 className="h-display mt-6 text-2xl sm:text-3xl">Every kind of celebration</h2>
                        <p className="mt-3 text-[15px] text-fog">From backyard birthdays to full-campus fun days.</p>
                        <ul className="mt-7 flex flex-wrap gap-2">
                            {EVENT_TYPES.map((e) => (
                                <li
                                    key={e}
                                    className="rounded-full border border-line bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/85"
                                >
                                    {e}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="card relative overflow-hidden p-8 sm:p-10">
                        <div aria-hidden className="glow-volt absolute -right-20 -top-20 h-72 w-72" />
                        <BsJoystick className="relative text-gold" size={30} aria-hidden />
                        <h2 className="h-display relative mt-6 text-2xl sm:text-3xl">Where we bring the party</h2>
                        <p className="relative mt-3 text-[15px] text-fog">
                            Standard service area, no travel fee:
                        </p>
                        <ul className="relative mt-4 flex flex-wrap gap-2">
                            {AREAS.map((a) => (
                                <li key={a.slug}>
                                    <Link
                                        to={a.path}
                                        className="inline-block rounded-full bg-gold px-4 py-2 text-sm font-bold text-ink transition hover:bg-gold-soft"
                                    >
                                        {a.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <p className="relative mt-6 text-[15px] text-fog">Also available with a travel surcharge:</p>
                        <ul className="relative mt-4 flex flex-wrap gap-2">
                            {SERVICE_AREAS.surcharge.map((a) => (
                                <li
                                    key={a}
                                    className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-white/85"
                                >
                                    {a}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <Reviews />

            {/* FAQ preview */}
            <section className="wrap mt-28 sm:mt-36">
                <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
                    <div>
                        <SectionHeading eyebrow="Good to know" title="Before the big day" />
                        <Link
                            to="/about"
                            className="mt-8 inline-flex items-center gap-2 font-semibold text-gold hover:text-gold-soft"
                        >
                            Read all FAQs <MdArrowForward aria-hidden />
                        </Link>
                    </div>
                    <FaqList faqs={FAQS.filter((f) => /rain|parking|Wi-Fi|travel/.test(f.question))} />
                </div>
            </section>

            <CtaBand />
        </>
    );
}

import { SiPlaystation5, SiXbox, SiNintendoswitch, SiOculus } from "react-icons/si";
import { GiJoystick, GiLaserBlast } from "react-icons/gi";
import { MdCheck } from "react-icons/md";
import { CtaBand, Img, PageHero, SectionHeading } from "../components/ui";
import { photo } from "../data/photos";

const SPECS = [
    { value: "7", label: "indoor 4K TVs with soundbars" },
    { value: "2", label: "outdoor 4K TVs under a 14' awning" },
    { value: "28", label: "players gaming at once" },
    { value: "1,000+", label: "retro arcade classics" },
];

const SYSTEMS = [
    { icon: SiPlaystation5, name: "PlayStation 5" },
    { icon: SiXbox, name: "Xbox Series X" },
    { icon: SiNintendoswitch, name: "Nintendo Switch" },
    { icon: SiOculus, name: "Stand-alone VR" },
    { icon: GiJoystick, name: "1,000+ retro arcade games" },
    { icon: GiLaserBlast, name: "Arena laser tag" },
];

const SECTIONS = [
    {
        photo: photo("trailer-night-closeup"),
        eyebrow: "Game coaches",
        title: "Hosts who live and breathe games",
        text: "Our game coaches help, instruct and even play with your guests. They switch titles, settle tournament brackets and make sure every kid has a great time while they're under our roof.",
        bullets: ["Help choosing and changing games", "Keep every screen busy", "Friendly with first-timers"],
    },
    {
        photo: photo("trailer-entrance"),
        eyebrow: "Tech amenities",
        title: "Built for comfort, wired for fun",
        text: "Soundbars on every TV, a dedicated VR section and phone charging stations, all inside a climate-controlled luxury trailer with heat for the winter and A/C for the summer.",
        bullets: ["Charging station for phones", "Soundbar for every TV", "Stand-alone VR section"],
    },
    {
        photo: photo("happy-family"),
        eyebrow: "The celebration",
        title: "Photo-ready from every angle",
        text: "The custom superhero wrap and LED lighting make for gorgeous party photos. Every package can include up to 25 printed cardstock invites, or design a free e-invite online.",
        bullets: ["Free T-shirt + gift for the guest of honor", "Wristbands for every guest", "Printed or digital invites"],
    },
];

export default function Services() {
    return (
        <>
            <PageHero
                eyebrow="The trailer"
                title={
                    <>
                        Step inside our <span className="text-gradient">luxury gaming trailer</span>
                    </>
                }
                lede="A mobile gaming theater that pulls up to your home, school or venue anywhere in Queens, Brooklyn and Long Island, loaded with the latest consoles and run by friendly game coaches."
            />

            <section className="wrap">
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
                    {SPECS.map((s) => (
                        <div key={s.label} className="bg-surface p-6 sm:p-8">
                            <dt className="sr-only">{s.label}</dt>
                            <dd className="font-display text-4xl font-bold text-white sm:text-5xl">{s.value}</dd>
                            <dd className="mt-2 text-sm text-fog">{s.label}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <section className="wrap mt-24">
                <SectionHeading eyebrow="On board" title="Every system worth playing" />
                <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {SYSTEMS.map((s) => (
                        <li key={s.name} className="card flex items-center gap-4 p-5 sm:p-6">
                            <s.icon size={28} className="shrink-0 text-gold" aria-hidden />
                            <span className="text-sm font-bold text-white sm:text-base">{s.name}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="wrap mt-24 space-y-24 sm:mt-32 sm:space-y-32">
                {SECTIONS.map((s, i) => (
                    <section key={s.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                        <div
                            className={`aspect-[4/3] overflow-hidden rounded-3xl border border-line ${
                                i % 2 ? "lg:order-2" : ""
                            }`}
                        >
                            <Img photo={s.photo} />
                        </div>
                        <div>
                            <SectionHeading eyebrow={s.eyebrow} title={s.title} lede={s.text} />
                            <ul className="mt-7 space-y-3">
                                {s.bullets.map((b) => (
                                    <li key={b} className="flex gap-3 text-white/85">
                                        <MdCheck className="mt-0.5 shrink-0 text-gold" size={20} aria-hidden />
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                ))}
            </div>

            <CtaBand />
        </>
    );
}

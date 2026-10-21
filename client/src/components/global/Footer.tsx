import { Link, useLocation } from "react-router-dom";
import { FaInstagram, FaGoogle } from "react-icons/fa6";
import { MdEmail, MdPhone } from "react-icons/md";
import { NAV_LINKS, SERVICE_AREAS, SITE } from "../../site";
import Logo from "./Logo";
import { BookButton } from "./Header";

export default function Footer() {
    const { pathname } = useLocation();
    if (["/e-invites", "/book", "/checkout", "/checkout-details"].includes(pathname)) return null;

    return (
        <footer className="relative mt-24 border-t border-line bg-surface">
            <div className="wrap py-16">
                <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
                    <div>
                        <Logo />
                        <p className="mt-5 max-w-sm text-sm leading-relaxed text-fog">
                            Luxury video game trailer and arena-style laser tag parties. We bring the party to your
                            door, rain or shine.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <a
                                href={SITE.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="grid h-10 w-10 place-items-center rounded-full border border-line text-fog transition hover:border-gold hover:text-gold"
                            >
                                <FaInstagram size={18} />
                            </a>
                            <a
                                href={SITE.googleMaps}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Google reviews"
                                className="grid h-10 w-10 place-items-center rounded-full border border-line text-fog transition hover:border-gold hover:text-gold"
                            >
                                <FaGoogle size={16} />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white">
                            Explore
                        </h2>
                        <ul className="mt-5 space-y-3 text-sm">
                            {NAV_LINKS.map((l) => (
                                <li key={l.to}>
                                    <Link to={l.to} className="text-fog transition hover:text-white">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white">
                            Service area
                        </h2>
                        <ul className="mt-5 space-y-3 text-sm text-fog">
                            {SERVICE_AREAS.standard.map((a) => (
                                <li key={a}>{a}</li>
                            ))}
                            <li className="pt-1 text-xs text-fog/70">
                                + {SERVICE_AREAS.surcharge.join(", ")} (travel surcharge)
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white">
                            Book your party
                        </h2>
                        <ul className="mt-5 space-y-3 text-sm">
                            <li>
                                <a href={SITE.phoneHref} className="flex items-center gap-2 text-white hover:text-gold">
                                    <MdPhone className="text-gold" aria-hidden /> {SITE.phone}
                                </a>
                            </li>
                            <li>
                                <a
                                    href={`mailto:${SITE.email}`}
                                    className="flex items-center gap-2 break-all text-fog hover:text-white"
                                >
                                    <MdEmail className="shrink-0 text-gold" aria-hidden /> {SITE.email}
                                </a>
                            </li>
                        </ul>
                        <BookButton className="btn-gold mt-6" label="Check availability" />
                    </div>
                </div>

                <div className="mt-14 flex flex-col gap-3 border-t border-line pt-8 text-xs text-fog/70 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        © {new Date().getFullYear()} {SITE.name}. Family-owned in Queens, NY.
                    </p>
                    <p>
                        Party in New Jersey?{" "}
                        <a
                            href={SITE.sisterCompany}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-fog underline-offset-4 hover:text-white hover:underline"
                        >
                            Book our sister company TripleA
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}

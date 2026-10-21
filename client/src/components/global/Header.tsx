import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { MdPhone } from "react-icons/md";
import { NAV_LINKS, SITE } from "../../site.ts";
import Logo from "./Logo.tsx";

const Header = ({
    drawerOpen,
    setDrawerOpen,
}: {
    drawerOpen: boolean;
    setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? "hidden" : "";
    }, [drawerOpen]);

    if (location.pathname === "/e-invites" || location.pathname === "/admin") return null;

    const solid = scrolled || drawerOpen;

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
                solid ? "border-b border-line bg-ink/80 backdrop-blur-xl" : "border-b border-transparent"
            }`}
        >
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
            >
                Skip to content
            </a>
            <div className="wrap flex h-16 items-center justify-between gap-4 lg:h-20">
                <Link to="/" aria-label={`${SITE.name} home`} onClick={() => setDrawerOpen(false)}>
                    <Logo />
                </Link>

                <nav aria-label="Main" className="hidden lg:block">
                    <ul className="flex items-center gap-1">
                        {NAV_LINKS.slice(1).map((link) => (
                            <li key={link.to}>
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                                            isActive ? "bg-white/10 text-white" : "text-fog hover:text-white"
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex items-center gap-2">
                    <a
                        href={SITE.phoneHref}
                        className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-white hover:text-gold xl:inline-flex"
                    >
                        <MdPhone className="text-gold" size={18} aria-hidden />
                        {SITE.phone}
                    </a>
                    <BookButton className="btn-gold hidden px-5! py-2.5! sm:inline-flex" />
                    <button
                        type="button"
                        className="relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/4 lg:hidden"
                        aria-label={drawerOpen ? "Close menu" : "Open menu"}
                        aria-expanded={drawerOpen}
                        aria-controls="mobile-menu"
                        onClick={() => setDrawerOpen(!drawerOpen)}
                    >
                        <span
                            className={`absolute h-0.5 w-5 rounded bg-white transition-transform duration-300 ${
                                drawerOpen ? "rotate-45" : "-translate-y-1.5"
                            }`}
                        />
                        <span
                            className={`absolute h-0.5 w-5 rounded bg-white transition-opacity duration-200 ${
                                drawerOpen ? "opacity-0" : ""
                            }`}
                        />
                        <span
                            className={`absolute h-0.5 w-5 rounded bg-white transition-transform duration-300 ${
                                drawerOpen ? "-rotate-45" : "translate-y-1.5"
                            }`}
                        />
                    </button>
                </div>
            </div>

            <div
                id="mobile-menu"
                className={`overflow-hidden transition-[max-height,opacity] duration-300 lg:hidden ${
                    drawerOpen ? "max-h-dvh opacity-100" : "pointer-events-none max-h-0 opacity-0"
                }`}
            >
                <nav aria-label="Mobile" className="wrap flex h-[calc(100dvh-4rem)] flex-col pb-8 pt-4">
                    <ul className="flex flex-col">
                        {NAV_LINKS.map((link) => (
                            <li key={link.to} className="border-b border-line">
                                <NavLink
                                    to={link.to}
                                    end
                                    onClick={() => setDrawerOpen(false)}
                                    className={({ isActive }) =>
                                        `block py-4 font-display text-2xl font-semibold ${
                                            isActive ? "text-gold" : "text-white"
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-auto flex flex-col gap-3">
                        <BookButton className="btn-gold w-full py-4! text-base" />
                        <a href={SITE.phoneHref} className="btn-ghost w-full py-4! text-base">
                            <MdPhone size={20} aria-hidden /> Call {SITE.phone}
                        </a>
                    </div>
                </nav>
            </div>
        </header>
    );
};

// Opens the booking page, with a package already picked when one is given.
export function BookButton({
    className = "btn-gold",
    label = "Book Now",
    packageId,
}: {
    className?: string;
    label?: string;
    packageId?: string;
}) {
    return (
        <Link className={className} to={packageId ? `/book?package=${packageId}` : "/book"}>
            {label}
        </Link>
    );
}

export default Header;

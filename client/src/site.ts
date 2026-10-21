// Single source of truth for business details, page metadata and structured data.
// Used by the React app (client + prerender) so search engines and visitors see the same facts.

export const SITE = {
    name: "Prestigious Gaming on Wheels Plus",
    shortName: "PGOW Plus",
    url: "https://prestigiousgamingonwheelsplus.com",
    phone: "(718) 673-8529",
    phoneHref: "tel:+17186738529",
    phoneE164: "+1-718-673-8529",
    email: "tbnd@prestigiousgamingonwheelsplus.com",
    bookingUrl: "https://app.10to8.com/book/ymonerhexbfwnegoml/",
    instagram: "https://www.instagram.com/prestigiousgamingonwheelsplus/",
    googleMaps: "https://maps.google.com/?cid=8635943149184468988",
    sisterCompany: "https://www.tripleamobilegaming.com/",
    ogImage: "/og-image.jpg",
    geo: { latitude: 40.671612, longitude: -73.7834759 },
    // Cloudflare Turnstile spam check on the contact form. Site keys are public; the secret lives in the
    // TURNSTILE_SECRET env var on Pages. Dev uses Cloudflare's always-pass test key.
    turnstileSiteKey: import.meta.env.DEV ? "1x00000000000000000000AA" : "0x4AAAAAAFeqq_JRbsDecyPE",
};

export const SERVICE_AREAS = {
    standard: ["Queens", "Brooklyn", "Nassau County"],
    surcharge: ["Manhattan", "The Bronx", "Staten Island", "Westchester", "Suffolk County", "Connecticut"],
};

export const EVENT_TYPES = [
    "Birthday parties",
    "School events",
    "Church functions",
    "Fundraisers",
    "Bar & Bat Mitzvahs",
    "Proms",
    "Block parties",
    "Corporate events",
    "Charity events",
];

export const NAV_LINKS = [
    { to: "/", label: "Home" },
    { to: "/packages", label: "Packages" },
    { to: "/services", label: "The Trailer" },
    { to: "/gallery", label: "Gallery" },
    { to: "/bday-card", label: "E-Invites" },
    { to: "/about", label: "FAQ" },
    { to: "/contact-us", label: "Contact" },
];

export interface PageMeta {
    path: string;
    title: string;
    description: string;
    noindex?: boolean;
}

// Every indexable route. The prerender script turns each into a static HTML file and a sitemap entry.
export const PAGES: Record<string, PageMeta> = {
    "/": {
        path: "/",
        title: "Video Game Truck & Laser Tag Parties in Queens, Brooklyn & Long Island | Prestigious Gaming on Wheels Plus",
        description:
            "Luxury video game trailer parties that come to you. 9 HD screens, PS5, Xbox Series X, Nintendo Switch, VR and live-scored laser tag for up to 28 players. Serving Queens, Brooklyn, Nassau & all of NYC.",
    },
    "/packages": {
        path: "/packages",
        title: "Game Truck Party Prices & Packages | Prestigious Gaming on Wheels Plus",
        description:
            "Clear pricing for video game truck parties in NYC & Long Island: 2-hour parties from $550, laser tag, movie nights, VR, photobooth, karaoke, concessions and jumbo yard games.",
    },
    "/services": {
        path: "/services",
        title: "Inside Our Luxury Gaming Trailer: Consoles, VR & Laser Tag | Prestigious Gaming on Wheels Plus",
        description:
            "Tour our climate-controlled mobile gaming theater: 7 indoor + 2 outdoor HD TVs, PS5, Xbox Series X, Nintendo Switch, VR, 1,000+ retro arcade games, game coaches and arena-style laser tag.",
    },
    "/gallery": {
        path: "/gallery",
        title: "Party Photos: Game Truck & Laser Tag Events | Prestigious Gaming on Wheels Plus",
        description:
            "See real birthday parties, school events and laser tag battles with the Prestigious Gaming on Wheels Plus game trailer across Queens, Brooklyn and Long Island.",
    },
    "/about": {
        path: "/about",
        title: "About Us & FAQ | Prestigious Gaming on Wheels Plus",
        description:
            "A family-owned mobile gaming party company from Queens, NY. Answers about our trailer, consoles, weather, parking, service area and booking.",
    },
    "/contact-us": {
        path: "/contact-us",
        title: "Contact & Book a Game Truck Party | Prestigious Gaming on Wheels Plus",
        description:
            "Call (718) 673-8529 or send a message to book a video game truck or laser tag party in Queens, Brooklyn, Nassau County, Manhattan, the Bronx, Staten Island or Westchester.",
    },
    "/bday-card": {
        path: "/bday-card",
        title: "Free Gaming Birthday Party E-Invite Maker | Prestigious Gaming on Wheels Plus",
        description:
            "Create a free, printable gaming-themed birthday invitation in seconds. Add the birthday child's name, party date, location and RSVP number, then download.",
    },
};

export const NOT_FOUND_META: PageMeta = {
    path: "/404",
    title: "Page Not Found | Prestigious Gaming on Wheels Plus",
    description: "This page doesn't exist. Head back home to explore our video game truck parties.",
    noindex: true,
};

// Real routes that stay out of search results (booking flow, print view).
const APP_ROUTES = ["/book", "/checkout", "/checkout-details", "/e-invites"];

export function metaForPath(pathname: string): PageMeta {
    const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    if (APP_ROUTES.includes(clean))
        return { path: clean, title: `Book Your Party | ${SITE.name}`, description: PAGES["/"].description, noindex: true };
    return PAGES[clean] ?? NOT_FOUND_META;
}

export function absoluteUrl(path: string) {
    return SITE.url + (path === "/" ? "/" : path);
}

import { areaForPath } from "./data/areas";
import { Faq, FAQS } from "./data/faq";
import { PARTY_PACKAGES } from "./data/packages";
import { PageMeta, SERVICE_AREAS, SITE, absoluteUrl } from "./site";

const BUSINESS_ID = SITE.url + "/#business";

function businessSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "EntertainmentBusiness",
        "@id": BUSINESS_ID,
        name: SITE.name,
        alternateName: ["Prestigious Gaming", "PGOW Plus", "Prestigious Gaming on Wheels"],
        description:
            "Mobile video game trailer and arena-style laser tag parties for birthdays, schools, churches and corporate events across Queens, Brooklyn, Long Island and New York City.",
        url: SITE.url + "/",
        telephone: SITE.phoneE164,
        email: SITE.email,
        image: SITE.url + SITE.ogImage,
        logo: SITE.url + "/apple-touch-icon.png",
        priceRange: "$$",
        currenciesAccepted: "USD",
        address: { "@type": "PostalAddress", addressLocality: "Queens", addressRegion: "NY", addressCountry: "US" },
        geo: { "@type": "GeoCoordinates", ...SITE.geo },
        areaServed: [...SERVICE_AREAS.standard, ...SERVICE_AREAS.surcharge].map((name) => ({
            "@type": "AdministrativeArea",
            name,
        })),
        sameAs: [SITE.instagram, SITE.googleMaps],
        hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Party packages",
            itemListElement: PARTY_PACKAGES.map((p) => ({
                "@type": "Offer",
                price: p.price,
                priceCurrency: "USD",
                url: absoluteUrl("/packages"),
                itemOffered: { "@type": "Service", name: p.name, description: p.blurb },
            })),
        },
    };
}

function websiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": SITE.url + "/#website",
        url: SITE.url + "/",
        name: SITE.name,
        publisher: { "@id": BUSINESS_ID },
    };
}

function breadcrumbSchema(meta: PageMeta, label: string) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE.url + "/" },
            { "@type": "ListItem", position: 2, name: label, item: absoluteUrl(meta.path) },
        ],
    };
}

function faqSchema(faqs: Faq[]) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
    };
}

export function schemasFor(meta: PageMeta) {
    if (meta.noindex) return [];
    const crumbLabel = meta.title.split("|")[0].trim();
    const list: object[] = meta.path === "/" ? [businessSchema(), websiteSchema()] : [businessSchema()];
    if (meta.path !== "/") list.push(breadcrumbSchema(meta, crumbLabel));
    if (meta.path === "/about") list.push(faqSchema(FAQS));
    const area = areaForPath(meta.path);
    if (area) list.push(faqSchema(area.faqs));
    return list;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Full <head> SEO block for a page. Written into each prerendered HTML file at build time.
export function renderHead(meta: PageMeta) {
    const url = absoluteUrl(meta.path);
    const image = SITE.url + SITE.ogImage;
    const tags = [
        `<title>${esc(meta.title)}</title>`,
        `<meta name="description" content="${esc(meta.description)}" />`,
        meta.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${url}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="${esc(SITE.name)}" />`,
        `<meta property="og:locale" content="en_US" />`,
        `<meta property="og:title" content="${esc(meta.title)}" />`,
        `<meta property="og:description" content="${esc(meta.description)}" />`,
        `<meta property="og:url" content="${url}" />`,
        `<meta property="og:image" content="${image}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${esc(meta.title)}" />`,
        `<meta name="twitter:description" content="${esc(meta.description)}" />`,
        `<meta name="twitter:image" content="${image}" />`,
        `<meta name="geo.region" content="US-NY" />`,
        `<meta name="geo.placename" content="Queens, New York" />`,
        ...schemasFor(meta).map(
            (s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, "\\u003c")}</script>`
        ),
    ];
    return tags.join("\n        ");
}

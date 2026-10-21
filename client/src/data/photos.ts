// Optimized event photos. Each photo ships at 640px and 1280px widths (WebP) for responsive srcsets.
const small = import.meta.glob<string>("../assets/images/site/*-640.webp", { eager: true, import: "default" });
const large = import.meta.glob<string>("../assets/images/site/*-1280.webp", { eager: true, import: "default" });

export interface Photo {
    src: string;
    srcSet: string;
    alt: string;
    width: number;
    height: number;
}

const meta: Record<string, { alt: string; w: number; h: number }> = {
    "trailer-night-glow": { alt: "Prestigious Gaming on Wheels Plus trailer glowing with LED lights at a night party", w: 1280, h: 1273 },
    "trailer-street": { alt: "Superhero-wrapped video game trailer parked on a city street", w: 1280, h: 956 },
    "trailer-night-closeup": { alt: "Outdoor gaming screens lit up on the side of the game truck at night", w: 1280, h: 955 },
    "trailer-night-wide": { alt: "Game trailer with neon underglow set up for an evening birthday party", w: 1280, h: 1276 },
    "happy-family": { alt: "Family celebrating in front of the gaming trailer", w: 1280, h: 959 },
    "birthday-group": { alt: "Group of kids posing in front of the game truck at a birthday party", w: 1280, h: 1057 },
    "night-party-group": { alt: "Party guests gathered outside the illuminated game trailer at night", w: 1280, h: 1058 },
    "laser-tag-crates": { alt: "Kids playing arena-style laser tag behind inflatable crate obstacles", w: 1280, h: 959 },
    "laser-tag-bunker": { alt: "Boy taking cover behind an inflatable bunker during a laser tag party", w: 1280, h: 960 },
    "laser-tag-team": { alt: "Laser tag team in vests posing with blasters on a basketball court", w: 1280, h: 1284 },
    "laser-tag-friends": { alt: "Two friends holding laser tag blasters at a backyard party", w: 1202, h: 1600 },
    "concessions": { alt: "Popcorn and cotton candy machines set up under a party tent", w: 1280, h: 1272 },
    "trailer-entrance": { alt: "Entrance to the luxury gaming trailer with superhero wrap", w: 1280, h: 1276 },
    "trailer-panorama": { alt: "Panoramic view of the full-length video game trailer", w: 1280, h: 592 },
    "trailer-downtown": { alt: "Gaming trailer parked on a downtown street", w: 1280, h: 1276 },
    "trailer-parked": { alt: "Game truck parked and ready for a party", w: 1280, h: 942 },
    "laser-tag-arena": { alt: "Outdoor laser tag arena set up on a front lawn", w: 1280, h: 951 },
    "laser-tag-field": { alt: "Laser tag obstacles and tents set up on a sunny lawn", w: 1280, h: 945 },
    "laser-tag-action": { alt: "Kids crouching with laser tag blasters mid-game", w: 1200, h: 1600 },
};

export function photo(name: keyof typeof meta & string): Photo {
    const m = meta[name];
    const s = small[`../assets/images/site/${name}-640.webp`];
    const l = large[`../assets/images/site/${name}-1280.webp`];
    return { src: l, srcSet: `${s} 640w, ${l} ${m.w}w`, alt: m.alt, width: m.w, height: m.h };
}

export const GALLERY = [
    "birthday-group",
    "trailer-night-glow",
    "laser-tag-crates",
    "happy-family",
    "laser-tag-friends",
    "trailer-street",
    "night-party-group",
    "laser-tag-team",
    "concessions",
    "trailer-night-closeup",
    "laser-tag-bunker",
    "trailer-downtown",
    "laser-tag-action",
    "trailer-entrance",
    "laser-tag-arena",
    "trailer-night-wide",
    "laser-tag-field",
    "trailer-parked",
].map(photo);

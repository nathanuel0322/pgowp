export interface PartyPackage {
    id: string;
    name: string;
    price: number;
    duration: string;
    blurb: string;
    features: string[];
    featured?: boolean;
    // 10to8 service-detail id, so "Book this party" opens straight to this package's booking flow.
    bookingService: number;
}

export interface AddOn {
    name: string;
    price: number | null;
    note?: string;
}

export interface AddOnGroup {
    title: string;
    items: AddOn[];
}

const gamingIncludes = [
    "Every new release, Fortnite included",
    "Game coaches on board the whole party",
    "Wristbands for every guest",
    "Free T-shirt + gift for the guest of honor",
    "Up to 25 cardstock invites on request",
    "Up to 24 kids ($10 per extra child)",
];

export const PARTY_PACKAGES: PartyPackage[] = [
    {
        id: "gaming-2hr",
        bookingService: 1516842,
        name: "2-Hour Gaming Party",
        price: 550,
        duration: "2 hours",
        blurb: "Two hours of nonstop gaming in our climate-controlled luxury trailer.",
        features: gamingIncludes,
    },
    {
        id: "gaming-3hr",
        bookingService: 1144565,
        name: "3-Hour Gaming Party",
        price: 700,
        duration: "3 hours",
        blurb: "Our most-booked party. More time for tournaments, VR and the outdoor screens.",
        features: gamingIncludes,
        featured: true,
    },
    {
        id: "gaming-4hr",
        bookingService: 1508645,
        name: "4-Hour Gaming Party",
        price: 1050,
        duration: "4 hours",
        blurb: "The all-day blowout for big crews, block parties and school fun days.",
        features: gamingIncludes.slice(0, 5),
    },
    {
        id: "laser-tag",
        bookingService: 1222138,
        name: "Laser Tag Party",
        price: 700,
        duration: "1.5 hours",
        blurb: "Professional arena-style laser tag with live on-screen scoring, music and commentary.",
        features: [
            "Up to 20 players",
            "Inflatable arena obstacles set up in your space",
            "Live scoreboard + play-by-play commentating",
            "$200 deposit locks in your date",
            "Weather permitting, to protect the equipment",
        ],
    },
    {
        id: "movie",
        bookingService: 1144566,
        name: "Movie Party",
        price: 500,
        duration: "2 hours",
        blurb: "A private cinema on wheels. 7 HD TVs plus a large projector screen.",
        features: [
            "Bring any movie: DVD, Blu-ray or stream from your device",
            "Popcorn + juice pack for every guest",
            "Free T-shirt for the guest of honor",
            "Wristbands for every guest",
        ],
    },
    {
        id: "movie-gaming",
        bookingService: 1255645,
        name: "Movie + Gaming Combo",
        price: 875,
        duration: "4 hours",
        blurb: "The full movie party, followed by two hours of gaming.",
        features: ["Everything in the Movie Party", "2 hours of gaming after the credits roll", "Game coaches on board"],
    },
];

export const ADD_ON_GROUPS: AddOnGroup[] = [
    {
        title: "Party Upgrades",
        items: [
            { name: "Virtual reality (ages 10+)", price: 80, note: "$100 if added on-site" },
            { name: "Laser tag add-on", price: 22, note: "per child, two 15-min sessions" },
            { name: "Photobooth (digital)", price: 100, note: "unlimited digital shares" },
            { name: "Photobooth with sticker prints", price: 125, note: "up to 15 prints" },
            { name: "Karaoke", price: 75, note: "4 mics for the whole party" },
            { name: "Additional party time", price: 150, note: "per hour" },
        ],
    },
    {
        title: "Concessions",
        items: [
            { name: "Cotton candy machine", price: 225, note: "a serving per guest" },
            { name: "Popcorn machine", price: 175, note: "a serving per guest" },
            { name: "Large hot dog grill", price: 150, note: "you supply the hot dogs" },
            { name: "Sno-cone machine", price: 125 },
        ],
    },
    {
        title: "Jumbo Yard Games",
        items: [
            { name: "Two giant Connect 4 sets", price: 145 },
            { name: "Giant Connect 4", price: 80 },
            { name: "Jumbo yard Jenga", price: 60 },
        ],
    },
    {
        title: "Equipment Rentals",
        items: [
            { name: "Projector + screen", price: 400, note: "refundable $150 deposit" },
            { name: "Projector", price: 250, note: "refundable $100 deposit" },
            { name: "4 x 4' stage", price: 150, note: "+$50 delivery, refundable deposit" },
        ],
    },
];

export const GROUP_EVENTS = [
    { name: "School events", detail: "2 to 6 hours of class rotations, gaming and live-scored laser tag." },
    {
        name: "School fun day",
        detail: "5 hours with every yard game, popcorn, cotton candy and the hot dog grill.",
    },
    {
        name: "Corporate events",
        detail: "4 hours of unlimited gaming, VR, laser tag, concessions and yard games.",
    },
    { name: "Block parties", detail: "Big crowds, outdoor screens and laser tag. Call us for a quote." },
];

export function formatPrice(price: number) {
    return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

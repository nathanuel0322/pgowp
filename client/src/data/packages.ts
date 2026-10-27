// Prices, deposits and booking rules for everything a customer can book online. The booking worker reads this
// file too, so the price a customer pays is always worked out on the server from these numbers.

export interface PartyPackage {
    id: string;
    name: string;
    price: number;
    duration: string;
    blurb: string;
    features: string[];
    featured?: boolean;
    // Charged online to hold the date. The rest is due when we arrive.
    deposit: number;
    // How long the party blocks the calendar, setup included.
    minutes: number;
    // Guests covered by the price, and the charge for each guest over that.
    includedGuests?: number;
    extraGuestPrice?: number;
    maxGuests: number;
}

export interface AddOn {
    // Add-ons with an id can be picked on the booking page.
    id?: string;
    name: string;
    price: number | null;
    note?: string;
    // Charged per guest instead of once per party.
    perGuest?: boolean;
    // Package ids this add-on can't be added to.
    notWith?: string[];
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
        name: "2-Hour Gaming Party",
        price: 550,
        duration: "2 hours",
        blurb: "Two hours of nonstop gaming in our climate-controlled luxury trailer.",
        features: gamingIncludes,
        deposit: 275,
        minutes: 120,
        includedGuests: 24,
        extraGuestPrice: 10,
        maxGuests: 60,
    },
    {
        id: "gaming-3hr",
        name: "3-Hour Gaming Party",
        price: 700,
        duration: "3 hours",
        blurb: "Our most-booked party. More time for tournaments, VR and the outdoor screens.",
        features: gamingIncludes,
        featured: true,
        deposit: 350,
        minutes: 180,
        includedGuests: 24,
        extraGuestPrice: 10,
        maxGuests: 60,
    },
    {
        id: "gaming-4hr",
        name: "4-Hour Gaming Party",
        price: 1050,
        duration: "4 hours",
        blurb: "The all-day blowout for big crews, block parties and school fun days.",
        features: gamingIncludes.slice(0, 5),
        deposit: 525,
        minutes: 240,
        maxGuests: 60,
    },
    {
        id: "laser-tag",
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
        deposit: 200,
        minutes: 120,
        maxGuests: 20,
    },
    {
        id: "movie",
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
        deposit: 250,
        minutes: 180,
        maxGuests: 60,
    },
    {
        id: "movie-gaming",
        name: "Movie + Gaming Combo",
        price: 875,
        duration: "4 hours",
        blurb: "The full movie party, followed by two hours of gaming.",
        features: ["Everything in the Movie Party", "2 hours of gaming after the credits roll", "Game coaches on board"],
        deposit: 437.5,
        minutes: 240,
        maxGuests: 60,
    },
];

// Extra party time is picked by the hour on the booking page, and lengthens the calendar block.
// Shown on the booking page and in every customer email.
export const CANCELLATION_POLICY =
    "We have a 48-hour cancellation policy. If you miss your appointment or cancel with less than 48 hours' notice, your deposit is nonrefundable.";

export const EXTRA_HOUR_PRICE = 150;
export const MAX_EXTRA_HOURS = 3;

export const ADD_ON_GROUPS: AddOnGroup[] = [
    {
        title: "Party Upgrades",
        items: [
            { id: "vr", name: "Virtual reality (ages 10+)", price: 80, note: "$100 if added on-site" },
            {
                id: "laser-tag-sessions",
                name: "Laser tag add-on",
                price: 22,
                note: "per child, two 15-min sessions",
                perGuest: true,
                notWith: ["laser-tag"],
            },
            { id: "photobooth", name: "Photobooth (digital)", price: 100, note: "unlimited digital shares" },
            { id: "photobooth-prints", name: "Photobooth with sticker prints", price: 125, note: "up to 15 prints" },
            { id: "karaoke", name: "Karaoke", price: 75, note: "4 mics for the whole party" },
            { id: "throne-chair", name: "Navy & gold throne chair", price: 135, note: "for the guest of honor" },
            { name: "Additional party time", price: EXTRA_HOUR_PRICE, note: "per hour" },
        ],
    },
    {
        title: "Concessions",
        items: [
            { id: "cotton-candy", name: "Cotton candy machine", price: 225, note: "a serving per guest" },
            { id: "popcorn", name: "Popcorn machine", price: 175, note: "a serving per guest" },
            { id: "hot-dog-grill", name: "Large hot dog grill", price: 150, note: "you supply the hot dogs" },
            { id: "sno-cone", name: "Sno-cone machine", price: 125 },
        ],
    },
    {
        title: "Jumbo Yard Games",
        items: [
            { id: "connect-4-pair", name: "Two giant Connect 4 sets", price: 145 },
            { id: "connect-4", name: "Giant Connect 4", price: 80 },
            { id: "jenga", name: "Jumbo yard Jenga", price: 60 },
        ],
    },
    {
        title: "Equipment Rentals",
        items: [
            { id: "projector-screen", name: "Projector + screen", price: 400, note: "refundable $150 deposit" },
            { id: "projector", name: "Projector", price: 250, note: "refundable $100 deposit" },
            { id: "projector-screen-only", name: "Projector screen", price: 195, note: "144\", refundable $75 deposit" },
            { id: "stage", name: "4 x 4' stage", price: 150, note: "+$50 delivery, refundable deposit" },
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
    const cents = !Number.isInteger(price);
    return "$" + price.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
}

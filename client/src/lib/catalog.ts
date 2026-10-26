// The party packages and add-ons customers can book, with their prices. src/data/packages.ts holds the defaults;
// managers edit the live copy on /admin (saved in D1, table catalog). The site, the booking page and the worker all
// run it through parseCatalog, so a half-filled or broken save can't break booking.
import { ADD_ON_GROUPS, PARTY_PACKAGES, type AddOn, type AddOnGroup, type PartyPackage } from "../data/packages";

export interface Catalog {
    packages: PartyPackage[];
    addOnGroups: AddOnGroup[];
}

export const DEFAULT_CATALOG: Catalog = { packages: PARTY_PACKAGES, addOnGroups: ADD_ON_GROUPS };

// Stripe won't charge less than $0.50, so a package always needs a real deposit.
export const MIN_DEPOSIT = 1;
const MAX_PRICE = 100000;
const ID = /^[a-z0-9][a-z0-9-]{0,39}$/;

type Raw = Record<string, unknown>;

const str = (value: unknown, max: number) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "");

function dollars(value: unknown) {
    if (value === "" || value === null || value === undefined) return NaN;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 && n <= MAX_PRICE ? Math.round(n * 100) / 100 : NaN;
}

// Ids are saved on bookings, so existing ones are kept as they are. New items get one made from their name.
function idFor(value: unknown, name: string, taken: Set<string>) {
    const given = str(value, 40);
    if (ID.test(given) && !taken.has(given)) return given;
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 34) || "item";
    let id = base;
    for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
    return id;
}

export function describeMinutes(minutes: number) {
    const hours = minutes / 60;
    return Number.isInteger(hours) ? `${hours} hour${hours === 1 ? "" : "s"}` : `${minutes} minutes`;
}

function parsePackage(raw: Raw, taken: Set<string>): PartyPackage | string {
    const name = str(raw.name, 80);
    if (!name) return "Every package needs a name.";
    const price = dollars(raw.price);
    if (Number.isNaN(price)) return `Check the price for ${name}.`;
    const deposit = dollars(raw.deposit);
    if (Number.isNaN(deposit) || deposit < MIN_DEPOSIT || deposit > price)
        return `The deposit for ${name} has to be at least $${MIN_DEPOSIT} and no more than the price.`;
    const minutes = Math.round(Number(raw.minutes));
    if (!Number.isFinite(minutes) || minutes < 15 || minutes > 24 * 60) return `Check how many minutes ${name} lasts.`;
    const id = idFor(raw.id, name, taken);
    taken.add(id);
    return {
        id,
        name,
        price,
        deposit,
        duration: str(raw.duration, 40) || describeMinutes(minutes),
        minutes,
        blurb: str(raw.blurb, 300),
        features: (Array.isArray(raw.features) ? raw.features : [])
            .map((f) => str(f, 160))
            .filter(Boolean)
            .slice(0, 12),
        ...(raw.featured === true ? { featured: true } : {}),
    };
}

function parseAddOn(raw: Raw, taken: Set<string>): AddOn | string {
    const name = str(raw.name, 80);
    if (!name) return "Every add-on needs a name.";
    // A blank price means "ask us": it's listed on the packages page but can't be booked online.
    const price = raw.price === null || raw.price === "" ? null : dollars(raw.price);
    if (Number.isNaN(price)) return `Check the price for ${name}.`;
    const minutes = raw.minutes === undefined || raw.minutes === "" ? 0 : Math.round(Number(raw.minutes));
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 8 * 60) return `Check the extra minutes for ${name}.`;
    const id = idFor(raw.id, name, taken);
    taken.add(id);
    const note = str(raw.note, 100);
    return {
        id,
        name,
        price,
        ...(note ? { note } : {}),
        ...(raw.perChild === true ? { perChild: true } : {}),
        ...(minutes ? { minutes } : {}),
    };
}

export function parseCatalog(raw: unknown): { catalog: Catalog; error?: undefined } | { catalog?: undefined; error: string } {
    const data = (raw ?? {}) as Raw;
    if (!Array.isArray(data.packages) || !Array.isArray(data.addOnGroups)) return { error: "The price list is missing." };
    if (!data.packages.length) return { error: "Keep at least one party package." };
    if (data.packages.length > 30) return { error: "That's too many packages." };
    if (data.addOnGroups.length > 12) return { error: "That's too many add-on groups." };

    const packageIds = new Set<string>();
    const packages: PartyPackage[] = [];
    for (const item of data.packages) {
        const pkg = parsePackage((item ?? {}) as Raw, packageIds);
        if (typeof pkg === "string") return { error: pkg };
        packages.push(pkg);
    }

    const addOnIds = new Set<string>();
    const addOnGroups: AddOnGroup[] = [];
    for (const item of data.addOnGroups) {
        const group = (item ?? {}) as Raw;
        const title = str(group.title, 60);
        const items = Array.isArray(group.items) ? group.items : [];
        if (!title) return { error: "Every add-on group needs a title." };
        if (items.length > 40) return { error: `${title} has too many add-ons.` };
        const parsed: AddOn[] = [];
        for (const raw of items) {
            const addOn = parseAddOn((raw ?? {}) as Raw, addOnIds);
            if (typeof addOn === "string") return { error: addOn };
            parsed.push(addOn);
        }
        addOnGroups.push({ title, items: parsed });
    }
    return { catalog: { packages, addOnGroups } };
}

// What a saved row turns into. Falls back to the defaults rather than failing.
export function catalogFrom(raw: unknown): Catalog {
    return parseCatalog(raw).catalog ?? DEFAULT_CATALOG;
}

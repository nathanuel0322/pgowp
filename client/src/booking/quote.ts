// Prices a booking from the catalog. The booking page uses it to show the total as the customer picks things,
// and the worker uses it again to charge the deposit, so nothing the browser sends can change a price.
import { ADD_ON_GROUPS, AddOn, EXTRA_HOUR_PRICE, MAX_EXTRA_HOURS, PARTY_PACKAGES, PartyPackage } from "../data/packages";

export const BOOKABLE_ADD_ONS = ADD_ON_GROUPS.flatMap((g) => g.items).filter(
    (a): a is AddOn & { id: string; price: number } => !!a.id && a.price !== null
);

export interface QuoteInput {
    packageId: string;
    addOns: string[];
    extraHours: number;
    guests: number;
}

export interface QuoteLine {
    label: string;
    amount: number;
}

export interface Quote {
    pkg: PartyPackage;
    lines: QuoteLine[];
    total: number;
    deposit: number;
    balance: number;
    // Calendar time the party takes up, extra hours included.
    minutes: number;
}

export class QuoteError extends Error {}

export const findPackage = (id: string) => PARTY_PACKAGES.find((p) => p.id === id);

export function addOnsFor(pkg: PartyPackage) {
    return BOOKABLE_ADD_ONS.filter((a) => !a.notWith?.includes(pkg.id));
}

const cents = (n: number) => Math.round(n * 100) / 100;

export function quote({ packageId, addOns, extraHours, guests }: QuoteInput): Quote {
    const pkg = findPackage(packageId);
    if (!pkg) throw new QuoteError("Please pick a party package.");
    if (!Number.isInteger(guests) || guests < 1) throw new QuoteError("Please enter how many guests are coming.");
    if (guests > pkg.maxGuests)
        throw new QuoteError(`${pkg.name} is for up to ${pkg.maxGuests} guests. Please call us for bigger groups.`);
    if (!Number.isInteger(extraHours) || extraHours < 0 || extraHours > MAX_EXTRA_HOURS)
        throw new QuoteError(`You can add up to ${MAX_EXTRA_HOURS} extra hours online.`);

    const lines: QuoteLine[] = [{ label: pkg.name, amount: pkg.price }];
    if (pkg.includedGuests && pkg.extraGuestPrice && guests > pkg.includedGuests) {
        const extra = guests - pkg.includedGuests;
        lines.push({ label: `${extra} extra guest${extra === 1 ? "" : "s"}`, amount: extra * pkg.extraGuestPrice });
    }
    if (extraHours)
        lines.push({
            label: `${extraHours} extra hour${extraHours === 1 ? "" : "s"}`,
            amount: extraHours * EXTRA_HOUR_PRICE,
        });

    const allowed = addOnsFor(pkg);
    for (const id of new Set(addOns)) {
        const addOn = allowed.find((a) => a.id === id);
        if (!addOn) throw new QuoteError("One of the add-ons you picked isn't available with this package.");
        lines.push(
            addOn.perGuest
                ? { label: `${addOn.name} × ${guests}`, amount: addOn.price * guests }
                : { label: addOn.name, amount: addOn.price }
        );
    }

    const total = cents(lines.reduce((sum, l) => sum + l.amount, 0));
    return {
        pkg,
        lines,
        total,
        deposit: pkg.deposit,
        balance: cents(total - pkg.deposit),
        minutes: pkg.minutes + extraHours * 60,
    };
}

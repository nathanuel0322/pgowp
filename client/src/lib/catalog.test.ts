import { describe, expect, it } from "vitest";
import { DEFAULT_CATALOG, catalogFrom, parseCatalog } from "./catalog";
import { bookableAddOnGroups, quoteBooking } from "./booking";

const clone = () => JSON.parse(JSON.stringify(DEFAULT_CATALOG));

describe("parseCatalog", () => {
    it("keeps the default price list as it is", () => {
        expect(parseCatalog(clone()).catalog).toEqual(DEFAULT_CATALOG);
    });

    it("reads prices typed as text and gives new items an id", () => {
        const raw = clone();
        raw.packages[0].price = "600";
        raw.packages.push({ id: "", name: "Glow Party!", price: "450.5", deposit: "100", minutes: "90", features: ["A", " ", "B"] });
        raw.addOnGroups[0].items.push({ id: "", name: "Glow sticks", price: "", minutes: "" });
        const { catalog } = parseCatalog(raw);
        expect(catalog!.packages[0].price).toBe(600);
        const glow = catalog!.packages.at(-1)!;
        expect(glow).toMatchObject({ id: "glow-party", price: 450.5, deposit: 100, minutes: 90, duration: "90 minutes", features: ["A", "B"] });
        const sticks = catalog!.addOnGroups[0].items.at(-1)!;
        expect(sticks).toEqual({ id: "glow-sticks", name: "Glow sticks", price: null });
    });

    it("never gives two items the same id", () => {
        const raw = clone();
        raw.packages.push({ ...raw.packages[0], id: raw.packages[0].id });
        const ids = parseCatalog(raw).catalog!.packages.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("rejects prices and deposits that can't work", () => {
        const noPrice = clone();
        noPrice.packages[0].price = "";
        expect(parseCatalog(noPrice).error).toMatch(/price/);
        const bigDeposit = clone();
        bigDeposit.packages[0].deposit = bigDeposit.packages[0].price + 1;
        expect(parseCatalog(bigDeposit).error).toMatch(/deposit/);
        const freeDeposit = clone();
        freeDeposit.packages[0].deposit = 0;
        expect(parseCatalog(freeDeposit).error).toMatch(/deposit/);
        expect(parseCatalog({ packages: [], addOnGroups: [] }).error).toBeTruthy();
    });

    it("falls back to the defaults for a broken saved row", () => {
        expect(catalogFrom(null)).toBe(DEFAULT_CATALOG);
        expect(catalogFrom({ packages: "nope" })).toBe(DEFAULT_CATALOG);
    });
});

describe("quoting with an edited price list", () => {
    it("uses the edited prices and hides add-ons without a price", () => {
        const raw = clone();
        raw.packages[0].price = 600;
        raw.addOnGroups[0].items[0].price = "";
        const { catalog } = parseCatalog(raw);
        expect(quoteBooking(raw.packages[0].id, [], catalog!).total).toBe(600);
        const vrId = raw.addOnGroups[0].items[0].id;
        expect(bookableAddOnGroups(catalog!).flatMap((g) => g.items).some((a) => a.id === vrId)).toBe(false);
        expect(() => quoteBooking(raw.packages[0].id, [{ id: vrId, qty: 1 }], catalog!)).toThrow();
    });
});

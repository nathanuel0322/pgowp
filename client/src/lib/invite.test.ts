import { describe, expect, it } from "vitest";
import {
    INVITE_FIELDS,
    INVITE_SLOTS,
    MAX_LENGTHS,
    MAX_SIZE,
    Measure,
    cleanText,
    ellipsize,
    fitText,
    inviteFileName,
    layoutInvite,
    wrapText,
} from "./invite";

// Rough stand-in for a bold sans: every grapheme is 0.6em wide.
const measure: Measure = (text, size) => Array.from(text).length * size * 0.6;

const SLOT_WIDTH = INVITE_SLOTS.childname.x2 - INVITE_SLOTS.childname.x1 - 16;

describe("cleanText", () => {
    it("collapses whitespace, tabs and newlines", () => {
        expect(cleanText("  Jayden \n\t Smith  ")).toBe("Jayden Smith");
        expect(cleanText("   ")).toBe("");
    });
});

describe("wrapText", () => {
    it("keeps short text on one line", () => {
        expect(wrapText("Jayden", 20, 300, measure)).toEqual(["Jayden"]);
    });

    it("breaks between words", () => {
        const lines = wrapText("123 Main Street Queens New York", 20, 150, measure);
        expect(lines.length).toBeGreaterThan(1);
        lines.forEach((l) => expect(measure(l, 20)).toBeLessThanOrEqual(150));
        expect(lines.join(" ")).toBe("123 Main Street Queens New York");
    });

    it("splits a single word that is wider than the line", () => {
        const word = "Supercalifragilisticexpialidocious";
        const lines = wrapText(word, 20, 100, measure);
        expect(lines.join("")).toBe(word);
        lines.forEach((l) => expect(measure(l, 20)).toBeLessThanOrEqual(100));
    });

    it("never splits an emoji or accented grapheme", () => {
        const text = "👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦";
        const lines = wrapText(text, 20, 30, measure);
        expect(lines.join("")).toBe(text);
        lines.forEach((l) => expect(l).not.toMatch(/^‍|‍$/));
    });
});

describe("ellipsize", () => {
    it("leaves fitting text alone", () => {
        expect(ellipsize("Short", 12, 200, measure)).toBe("Short");
    });

    it("cuts long text and adds an ellipsis that fits", () => {
        const out = ellipsize("a".repeat(200), 12, 100, measure);
        expect(out.endsWith("…")).toBe(true);
        expect(measure(out, 12)).toBeLessThanOrEqual(100);
    });
});

describe("fitText", () => {
    it("returns no lines for empty text", () => {
        expect(fitText("", 300, 30, measure).lines).toEqual([]);
    });

    it("uses the largest size for short text", () => {
        expect(fitText("Jayden", SLOT_WIDTH, 30, measure)).toEqual({ size: MAX_SIZE, lines: ["Jayden"] });
    });

    it("shrinks medium text to fit one line", () => {
        const text = "Jayden's 10th Birthday Bash";
        const fitted = fitText(text, SLOT_WIDTH, 36, measure);
        expect(fitted.lines).toEqual([text]);
        expect(fitted.size).toBeLessThan(MAX_SIZE);
        expect(measure(text, fitted.size)).toBeLessThanOrEqual(SLOT_WIDTH);
    });

    it("wraps long text to two lines when there is room", () => {
        const text = "Elmhurst Park, 75-25 Grand Ave, Elmhurst, NY 11373 (Playground side)";
        const fitted = fitText(text, SLOT_WIDTH, 37, measure);
        expect(fitted.lines.length).toBe(2);
        fitted.lines.forEach((l) => expect(measure(l, fitted.size)).toBeLessThanOrEqual(SLOT_WIDTH));
    });

    it("never overflows width or line count, whatever the input", () => {
        const samples = [
            "x".repeat(90),
            "word ".repeat(30),
            "🎮".repeat(60),
            "A very long location name that goes on and on and on and on and on and on and on and on",
        ];
        for (const text of samples) {
            for (const height of [29, 37]) {
                const fitted = fitText(cleanText(text), SLOT_WIDTH, height, measure);
                expect(fitted.lines.length).toBeGreaterThan(0);
                expect(fitted.lines.length).toBeLessThanOrEqual(2);
                fitted.lines.forEach((l) => expect(measure(l, fitted.size)).toBeLessThanOrEqual(SLOT_WIDTH));
            }
        }
    });
});

describe("layoutInvite", () => {
    const maxed = {
        childname: "W".repeat(MAX_LENGTHS.childname),
        location: "W ".repeat(MAX_LENGTHS.location / 2),
        partytime: "W".repeat(MAX_LENGTHS.partytime),
        phonenumber: "9".repeat(MAX_LENGTHS.phonenumber),
    };

    it("keeps every line inside its slot, above the red line and below the artwork", () => {
        for (const fields of [maxed, { childname: "Al", location: "Home", partytime: "Sat 2pm", phonenumber: "" }]) {
            for (const item of layoutInvite(fields, measure)) {
                const slot = INVITE_SLOTS[item.key];
                item.lines.forEach((line, i) => {
                    const width = measure(line, item.size);
                    expect(item.x - width / 2).toBeGreaterThanOrEqual(slot.x1);
                    expect(item.x + width / 2).toBeLessThanOrEqual(slot.x2);
                    const base = item.baselines[i];
                    expect(base + item.size * 0.24).toBeLessThan(slot.y);
                    expect(base - item.size * 0.82).toBeGreaterThanOrEqual(slot.top - 0.01);
                });
            }
        }
    });

    it("lays out all four fields in order and skips blank RSVP", () => {
        const layout = layoutInvite({ childname: "Al", location: "Home", partytime: "Sat", phonenumber: "  " }, measure);
        expect(layout.map((l) => l.key)).toEqual(INVITE_FIELDS);
        expect(layout[3].lines).toEqual([]);
    });
});

describe("inviteFileName", () => {
    it("builds a safe, readable file name", () => {
        expect(inviteFileName("Jayden")).toBe("jayden-birthday-invite.jpg");
        expect(inviteFileName("  José María  ")).toBe("jose-maria-birthday-invite.jpg");
        expect(inviteFileName("../../etc/passwd")).toBe("etc-passwd-birthday-invite.jpg");
        expect(inviteFileName("🎮🎮")).toBe("gaming-birthday-invite.jpg");
        expect(inviteFileName("")).toBe("gaming-birthday-invite.jpg");
        expect(inviteFileName("a".repeat(100)).length).toBeLessThanOrEqual(30 + "-birthday-invite.jpg".length);
    });
});

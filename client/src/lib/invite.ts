// Draws the gaming birthday e-invite in the browser: template image + the four details on its blank lines.
// Pure layout math (fitText, wrapText) is kept separate from canvas calls so it can be unit tested.

export interface InviteFields {
    childname: string;
    location: string;
    partytime: string;
    phonenumber: string;
}

export const INVITE_FIELDS: (keyof InviteFields)[] = ["childname", "location", "partytime", "phonenumber"];

// Template is 1024x696. Each slot is a blank red line: x1..x2 is its span, y is the line's top pixel row,
// top is the highest row text may reach before running into the artwork above.
export const TEMPLATE_SIZE = { width: 1024, height: 696 };
export const INVITE_SLOTS: Record<keyof InviteFields, { x1: number; x2: number; y: number; top: number }> = {
    childname: { x1: 140, x2: 469, y: 610, top: 577 },
    location: { x1: 653, x2: 982, y: 608, top: 568 },
    partytime: { x1: 140, x2: 468, y: 655, top: 614 },
    phonenumber: { x1: 653, x2: 981, y: 652, top: 611 },
};

export const MAX_LENGTHS: Record<keyof InviteFields, number> = {
    childname: 40,
    location: 90,
    partytime: 60,
    phonenumber: 25,
};

export const FONT_FAMILY = "Manrope";
const FONT_STACK = `${FONT_FAMILY}, "Helvetica Neue", Arial, sans-serif`;
const FONT_WEIGHT = 700;
export const fontFor = (size: number) => `${FONT_WEIGHT} ${size}px ${FONT_STACK}`;

// Manrope vertical metrics as a fraction of font size (ascent covers accented capitals).
const ASCENT = 0.82;
const DESCENT = 0.24;
const LINE_HEIGHT = 1.1;
const SIDE_PADDING = 8;
const LINE_GAP = 4; // space between the lowest descender and the red line

export const MAX_SIZE = 26;
const MIN_SINGLE = 15;
const MIN_SIZE = 11;

export type Measure = (text: string, size: number) => number;

export interface FittedText {
    size: number;
    lines: string[];
}

// Collapse whitespace (including pasted newlines and tabs) and trim.
export function cleanText(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

// Splits text into grapheme clusters so emoji and accented letters are never cut in half.
type GraphemeSegmenter = new (
    locale?: string,
    options?: { granularity: "grapheme" }
) => { segment(text: string): Iterable<{ segment: string }> };

function graphemes(text: string): string[] {
    const Segmenter = (Intl as unknown as { Segmenter?: GraphemeSegmenter }).Segmenter;
    if (Segmenter) return Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
    return Array.from(text);
}

// Longest prefix of `text` (whole graphemes) that fits in maxWidth, with an ellipsis if anything was cut.
export function ellipsize(text: string, size: number, maxWidth: number, measure: Measure) {
    if (measure(text, size) <= maxWidth) return text;
    const parts = graphemes(text);
    let lo = 0;
    let hi = parts.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (measure(parts.slice(0, mid).join("").trimEnd() + "…", size) <= maxWidth) lo = mid;
        else hi = mid - 1;
    }
    return parts.slice(0, lo).join("").trimEnd() + "…";
}

// Greedy word wrap. Words wider than maxWidth are broken between graphemes.
export function wrapText(text: string, size: number, maxWidth: number, measure: Measure): string[] {
    const lines: string[] = [];
    let current = "";
    for (const word of text.split(" ")) {
        const candidate = current ? `${current} ${word}` : word;
        if (measure(candidate, size) <= maxWidth) {
            current = candidate;
            continue;
        }
        if (current) lines.push(current);
        if (measure(word, size) <= maxWidth) {
            current = word;
            continue;
        }
        current = "";
        for (const g of graphemes(word)) {
            if (current && measure(current + g, size) > maxWidth) {
                lines.push(current);
                current = g;
            } else current += g;
        }
    }
    if (current) lines.push(current);
    return lines;
}

const blockHeight = (size: number, lineCount: number) =>
    size * ASCENT + size * DESCENT + (lineCount - 1) * size * LINE_HEIGHT;

// Picks the largest font size that fits the slot: one line if possible, else two, else two with an ellipsis.
export function fitText(text: string, maxWidth: number, maxHeight: number, measure: Measure): FittedText {
    if (!text) return { size: MAX_SIZE, lines: [] };
    for (let size = MAX_SIZE; size >= MIN_SINGLE; size--) {
        if (blockHeight(size, 1) <= maxHeight && measure(text, size) <= maxWidth) return { size, lines: [text] };
    }
    for (let size = MIN_SINGLE; size >= MIN_SIZE; size--) {
        if (blockHeight(size, 2) > maxHeight) continue;
        const lines = wrapText(text, size, maxWidth, measure);
        if (lines.length <= 2) return { size, lines };
    }
    const size = MIN_SIZE;
    const lines = wrapText(text, size, maxWidth, measure);
    // Too long even at the smallest size: keep one line if two won't fit vertically, and cut with an ellipsis.
    if (blockHeight(size, 2) > maxHeight) return { size, lines: [ellipsize(text, size, maxWidth, measure)] };
    const rest = lines.slice(1).join(" ");
    return { size, lines: [lines[0], ellipsize(rest, size, maxWidth, measure)] };
}

// Where each slot's text goes, in template pixels. Baselines run top to bottom.
export function layoutInvite(fields: InviteFields, measure: Measure) {
    return INVITE_FIELDS.map((key) => {
        const slot = INVITE_SLOTS[key];
        const maxWidth = slot.x2 - slot.x1 - SIDE_PADDING * 2;
        const maxHeight = slot.y - LINE_GAP - slot.top;
        const fitted = fitText(cleanText(fields[key] ?? ""), maxWidth, maxHeight, measure);
        const lastBaseline = slot.y - LINE_GAP - fitted.size * DESCENT;
        const baselines = fitted.lines.map(
            (_, i) => lastBaseline - (fitted.lines.length - 1 - i) * fitted.size * LINE_HEIGHT
        );
        return { key, x: (slot.x1 + slot.x2) / 2, baselines, ...fitted };
    });
}

export function canvasMeasure(ctx: CanvasRenderingContext2D): Measure {
    return (text, size) => {
        ctx.font = fontFor(size);
        return ctx.measureText(text).width;
    };
}

// Draws the details onto ctx. The context should already be scaled so 1 unit = 1 template pixel.
export function drawInviteText(ctx: CanvasRenderingContext2D, fields: InviteFields) {
    const measure = canvasMeasure(ctx);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (const item of layoutInvite(fields, measure)) {
        ctx.font = fontFor(item.size);
        item.lines.forEach((line, i) => ctx.fillText(line, item.x, item.baselines[i]));
    }
}

// Waits for the web font so canvas text doesn't fall back to Arial. Gives up after a short wait.
export async function ensureInviteFont(timeoutMs = 2500) {
    if (typeof document === "undefined" || !document.fonts) return;
    const load = document.fonts.load(fontFor(MAX_SIZE), "Aa1").catch(() => undefined);
    await Promise.race([load, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
}

export function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Couldn't load the invite template. Check your connection and try again."));
        img.src = src;
    });
}

// Full-size invite as a JPEG (about 0.5 MB, small enough to text). Drawn at 2x the template so the text stays sharp.
export async function renderInvite(templateSrc: string, fields: InviteFields, scale = 2): Promise<Blob> {
    const [img] = await Promise.all([loadImage(templateSrc), ensureInviteFont()]);
    const canvas = document.createElement("canvas");
    canvas.width = TEMPLATE_SIZE.width * scale;
    canvas.height = TEMPLATE_SIZE.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser couldn't create the image. Try another browser.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    drawInviteText(ctx, fields);
    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Your browser couldn't create the image."))),
            "image/jpeg",
            0.92
        )
    );
}

export function inviteFileName(childname: string) {
    const slug = cleanText(childname)
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 30)
        .toLowerCase();
    return `${slug || "gaming"}-birthday-invite.jpg`;
}

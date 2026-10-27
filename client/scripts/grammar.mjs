// Grammar and comma check for the site's copy. Pulls the visible text out of src/ (JSX text, prose string literals
// such as titles, ledes and package descriptions, and the email templates), sends each piece to a local LanguageTool
// server and prints every issue with its file and line. Spelling is left to cspell (`npm run spellcheck`).
//
//   docker run -d --name languagetool -p 8010:8010 erikvl87/languagetool
//   npm run grammar                      # or: npm run grammar -- src/screens/Home.tsx
//   npm run grammar -- --list            # print the extracted text without checking it
//
// LANGUAGETOOL_URL points it at another server (default http://localhost:8010).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = (process.env.LANGUAGETOOL_URL ?? "http://localhost:8010").replace(/\/$/, "");

// Spelling is cspell's job; the rest misfire on short UI labels and text pulled out of markup.
const DISABLED_RULES = [
    "MORFOLOGIK_RULE_EN_US",
    "WHITESPACE_RULE",
    "UPPERCASE_SENTENCE_START",
    "PUNCTUATION_PARAGRAPH_END",
    "DASH_RULE",
    "EN_QUOTES",
];

// Attributes whose strings are never shown as text.
const CODE_ATTRS = new Set(["className", "id", "href", "src", "type", "name", "autoComplete", "inputMode", "rel", "target", "d", "viewBox", "key", "to", "role", "pattern"]);
// Stands in for {expressions} and nested elements, so the sentence around them still reads as one.
const PLACEHOLDER = "X";

function sourceFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return sourceFiles(p);
        return /\.tsx?$/.test(e.name) && !/\.(test|d)\.tsx?$/.test(e.name) ? [p] : [];
    });
}

const tidy = (s) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

function looksLikeProse(text) {
    const words = text.split(" ");
    if (words.length < 3 || !/[a-z]/.test(text)) return false;
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|ON CONFLICT|AND|OR|WHERE|FROM)\b/.test(text)) return false;
    // Tailwind class lists, paths, URLs and other code-ish strings.
    if (words.some((w) => /^[a-z0-9-]+:|^https?:\/\/|^[\w-]+\/[\w-]+|^\[/.test(w))) return false;
    const classy = words.filter((w) => /^-?[a-z]+(-[\w./[\]%]+)+$/.test(w) || /^(flex|grid|block|hidden|relative|absolute|inline|uppercase|italic|truncate|rounded|border|shadow)$/.test(w));
    if (classy.length >= words.length / 2) return false;
    return /^[A-Z"'“‘(]/.test(text) || /[.!?,]/.test(text);
}

function insideCodeAttr(node) {
    for (let n = node.parent; n; n = n.parent) {
        if (ts.isJsxAttribute(n)) return CODE_ATTRS.has(n.name.getText());
        if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return true;
        // Object keys, e.g. { "Content-Type": ... }, and switch cases.
        if (ts.isPropertyAssignment(n) && n.name === node) return true;
        if (ts.isElementAccessExpression(n) || ts.isCaseClause(n)) return true;
        if (ts.isCallExpression(n) && /^(fetch|querySelector|getElementById|require|cn|clsx)$/.test(n.expression.getText().split(".").pop())) return true;
        if (ts.isJsxElement(n) || ts.isBlock(n)) return false;
    }
    return false;
}

function jsxText(node) {
    if (ts.isJsxText(node)) return node.text;
    if (ts.isJsxSelfClosingElement(node)) return node.tagName.getText() === "br" ? " " : PLACEHOLDER;
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) return node.children.map(jsxText).join("");
    if (ts.isJsxExpression(node)) {
        const e = node.expression;
        if (!e) return "";
        if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
        return PLACEHOLDER;
    }
    return "";
}

const hasDirectText = (el) => el.children.some((c) => ts.isJsxText(c) && /\w/.test(c.text));

export function extract(file, code) {
    const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const out = [];
    const add = (node, text) => {
        text = tidy(text);
        if (/[a-z]{2}/i.test(text)) out.push({ line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1, text });
    };
    const visit = (node) => {
        if ((ts.isJsxElement(node) || ts.isJsxFragment(node)) && hasDirectText(node)) {
            // The whole element is one piece of text; attributes are still visited for title/lede/alt strings.
            add(node, jsxText(node));
            if (ts.isJsxElement(node)) visit(node.openingElement);
            return;
        }
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
            const text = tidy(node.text);
            if (looksLikeProse(text) && !insideCodeAttr(node)) add(node, text);
        } else if (ts.isTemplateExpression(node)) {
            const raw = node.head.text + node.templateSpans.map((s) => PLACEHOLDER + s.literal.text).join("");
            if (looksLikeProse(tidy(raw)) && !insideCodeAttr(node)) add(node, raw);
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
    return out;
}

async function check(text) {
    const res = await fetch(`${server}/v2/check`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ text, language: "en-US", disabledRules: DISABLED_RULES.join(",") }),
    });
    if (!res.ok) throw new Error(`LanguageTool returned ${res.status}: ${await res.text()}`);
    return (await res.json()).matches;
}

async function main() {
    const args = process.argv.slice(2);
    const list = args.includes("--list");
    const targets = args.filter((a) => a !== "--list");
    const files = targets.length ? targets.map((t) => path.resolve(t)) : sourceFiles(path.join(root, "src"));

    let pieces = 0;
    let issues = 0;
    for (const file of files) {
        const rel = path.relative(root, file);
        for (const { line, text } of extract(file, fs.readFileSync(file, "utf8"))) {
            pieces++;
            if (list) {
                console.log(`${rel}:${line}  ${text}`);
                continue;
            }
            for (const m of await check(text)) {
                issues++;
                const fixes = m.replacements.slice(0, 3).map((r) => `"${r.value}"`).join(", ");
                console.log(`${rel}:${line}  ${m.message}${fixes ? ` → ${fixes}` : ""}`);
                console.log(`    ${text.slice(Math.max(0, m.offset - 40), m.offset + m.length + 40)}  [${m.rule.id}]`);
            }
        }
    }
    console.log(list ? `${pieces} pieces of text in ${files.length} files.` : `${issues} suggestions in ${pieces} pieces of text from ${files.length} files.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((e) => {
        console.error(e.cause?.code === "ECONNREFUSED" ? `No LanguageTool server at ${server}. Start one with:\n  docker run -d --name languagetool -p 8010:8010 erikvl87/languagetool` : e);
        process.exit(1);
    });
}

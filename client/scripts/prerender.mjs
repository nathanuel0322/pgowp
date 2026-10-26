// Turns the client build into static, crawlable HTML: one file per page with its own <title>, meta tags,
// structured data and fully rendered content. Also writes sitemap.xml and the 404 / app-shell pages.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const serverDir = path.join(root, "dist-server");

const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const { render, routes, appRoutes, siteUrl, notFoundHead, loadSiteData } = await import(
    pathToFileURL(path.join(serverDir, "entry-server.js")).href
);

const SEO_BLOCK = /<!--seo-start-->[\s\S]*?<!--seo-end-->/;
const ROOT = '<div id="root"><!--app-html--></div>';
if (!SEO_BLOCK.test(template) || !template.includes(ROOT)) throw new Error("index.html placeholders missing");

const page = (head, rootHtml) => template.replace(SEO_BLOCK, head).replace(ROOT, rootHtml);
const { pageData, shellData, reviewCount } = await loadSiteData();
console.log(`price list and ${reviewCount} reviews ready`);
const fileFor = (route) => path.join(dist, route === "/" ? "index.html" : `${route.slice(1)}.html`);

for (const route of routes) {
    const { html, head } = render(route);
    fs.writeFileSync(fileFor(route), page(head + pageData, `<div id="root" data-prerendered="${route}">${html}</div>`));
    console.log(`prerendered ${route}`);
}

// Client-rendered shells: Cloudflare Pages serves 404.html (with a 404 status) for unknown paths,
// so routes that aren't prerendered need their own file to keep a 200 status.
const shellHead = notFoundHead.replace(/<title>.*?<\/title>/, `<title>Prestigious Gaming on Wheels Plus</title>`);
for (const route of appRoutes) {
    fs.mkdirSync(path.dirname(fileFor(route)), { recursive: true });
    fs.writeFileSync(fileFor(route), page(shellHead + shellData, '<div id="root"></div>'));
}
fs.writeFileSync(path.join(dist, "404.html"), page(notFoundHead, '<div id="root"></div>'));

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
    .map(
        (r) =>
            `  <url><loc>${siteUrl}${r === "/" ? "/" : r}</loc><lastmod>${today}</lastmod><priority>${
                r === "/" ? "1.0" : r === "/packages" ? "0.9" : "0.7"
            }</priority></url>`
    )
    .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);
fs.rmSync(serverDir, { recursive: true, force: true });
console.log(`sitemap.xml written with ${routes.length} URLs`);

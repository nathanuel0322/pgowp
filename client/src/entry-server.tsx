import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App.tsx";
import { APP_ROUTES, PAGES, NOT_FOUND_META, SITE, metaForPath } from "./site.ts";
import { renderHead } from "./seo.ts";
import { catalogFrom } from "./lib/catalog.ts";
import { getCatalog, setCatalog } from "./lib/catalogStore.ts";

const inlineJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

// Called once by scripts/prerender.mjs before rendering: loads the live price list (the one managers edit on /admin)
// so the HTML shows it. The script tag hands the same list to the browser, so its first render matches the HTML. If
// the site can't be reached, the build carries on with the defaults.
export async function loadSiteData() {
    try {
        const res = await fetch(`${SITE.url}/api/booking/catalog`);
        if (res.ok) setCatalog(catalogFrom((await res.json()).catalog));
        else console.warn(`Live price list unavailable (${res.status}), using src/data/packages.ts`);
    } catch (error) {
        console.warn("Live price list unavailable, using src/data/packages.ts:", error);
    }
    return `<script>window.__CATALOG__=${inlineJson(getCatalog())}</script>`;
}

// Used only by scripts/prerender.mjs at build time.
export function render(url: string) {
    const html = renderToString(
        <StaticRouter location={url} future={{ v7_relativeSplatPath: true }}>
            <App />
        </StaticRouter>
    );
    return { html, head: renderHead(metaForPath(url)) };
}

export const routes = Object.keys(PAGES);
export const appRoutes = APP_ROUTES;
export const siteUrl = SITE.url;
export const notFoundHead = renderHead(NOT_FOUND_META);

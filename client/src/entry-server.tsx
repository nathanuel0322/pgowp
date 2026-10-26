import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App.tsx";
import { APP_ROUTES, PAGES, NOT_FOUND_META, SITE, metaForPath } from "./site.ts";
import { renderHead } from "./seo.ts";

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

import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "./App.tsx";
import { PAGES, NOT_FOUND_META, SITE, metaForPath } from "./site.ts";
import { renderHead } from "./seo.ts";

// Used only by scripts/prerender.mjs at build time.
export function render(url: string) {
    const html = renderToString(
        <StaticRouter location={url}>
            <App />
        </StaticRouter>
    );
    return { html, head: renderHead(metaForPath(url)) };
}

export const routes = Object.keys(PAGES);
export const siteUrl = SITE.url;
export const notFoundHead = renderHead(NOT_FOUND_META);

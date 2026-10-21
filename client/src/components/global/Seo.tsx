import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { absoluteUrl, metaForPath } from "../../site";

function setMeta(selector: string, attr: string, value: string) {
    const el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
    if (el) el.setAttribute(attr, value);
}

// Keeps <title>, description, canonical and social tags in sync during client-side navigation.
// The prerendered HTML already ships the correct tags for crawlers.
export default function Seo() {
    const { pathname } = useLocation();

    useEffect(() => {
        const meta = metaForPath(pathname);
        const url = absoluteUrl(meta.path);
        document.title = meta.title;
        setMeta('meta[name="description"]', "content", meta.description);
        setMeta('link[rel="canonical"]', "href", url);
        setMeta('meta[property="og:title"]', "content", meta.title);
        setMeta('meta[property="og:description"]', "content", meta.description);
        setMeta('meta[property="og:url"]', "content", url);
        setMeta('meta[name="twitter:title"]', "content", meta.title);
        setMeta('meta[name="twitter:description"]', "content", meta.description);
    }, [pathname]);

    return null;
}

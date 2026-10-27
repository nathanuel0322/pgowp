import { useEffect, useRef } from "react";
import { SectionHeading } from "../ui";
import { SITE } from "../../site";
import { WIDGIE_LOOK, WIDGIE_SCRIPT, WIDGIE_STYLES, WIDGIE_URL, WIDGIE_WIDGET_ID } from "../../lib/reviews";

// Containers the embed script has already been started for (React's dev double effects reuse the same element).
const started = new WeakSet<HTMLElement>();

// Widgie's stylesheet includes Tailwind's global reset. Importing it into a cascade layer makes the site's own
// (unlayered) styles win wherever both set something, so it can't restyle the rest of the page.
function loadStyles() {
    if (document.getElementById("widgie-styles")) return;
    const style = document.createElement("style");
    style.id = "widgie-styles";
    style.textContent = `@import url("${WIDGIE_STYLES}") layer(widgie);`;
    document.head.appendChild(style);
}

// The Widgie review widget. Its script looks for #widgie once when it runs, so it's added again every time this
// section mounts (client-side navigation renders a fresh container).
export default function Reviews({ className = "mt-28" }: { className?: string }) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = container.current;
        if (!el || started.has(el)) return;
        started.add(el);
        loadStyles();
        document.querySelectorAll("script[data-widgie]").forEach((s) => s.remove());
        const script = document.createElement("script");
        script.src = WIDGIE_SCRIPT;
        script.async = true;
        script.dataset.widgie = "";
        document.body.appendChild(script);
    }, []);

    return (
        <section className={className} aria-labelledby="reviews-title">
            <div className="wrap">
                <SectionHeading eyebrow="Reviews" title={<span id="reviews-title">Parents say it best</span>} />
                <div
                    ref={container}
                    id="widgie"
                    widget-id={WIDGIE_WIDGET_ID}
                    {...WIDGIE_LOOK}
                    className="mt-10 min-h-[26rem]"
                />
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-fog">
                    <p>
                        Had a party with us?{" "}
                        <a href={SITE.googleMaps} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold hover:underline">
                            Review us on Google
                        </a>{" "}
                        or{" "}
                        <a href={SITE.yelpReview} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold hover:underline">
                            on Yelp
                        </a>
                        .
                    </p>
                    <a
                        href={WIDGIE_URL}
                        target="_blank"
                        rel="noopener"
                        title="widgie: free Google and Yelp review widget for your website"
                        className="flex items-center gap-2.5 rounded-full border border-[#078efb]/40 bg-[#078efb]/10 py-1.5 pl-1.5 pr-4 text-white/90 transition hover:border-[#078efb] hover:bg-[#078efb]/20"
                    >
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#078efb] text-xs font-bold text-white" aria-hidden>
                            w
                        </span>
                        <span>
                            Reviews powered by <strong className="text-white">widgie.vip</strong>
                            <span className="hidden text-fog sm:inline"> · add yours free</span>
                        </span>
                    </a>
                </div>
            </div>
        </section>
    );
}

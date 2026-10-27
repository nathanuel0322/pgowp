// Google and Yelp reviews come from the owner's Widgie widget (https://widgie.vip). Its embed script mounts the widget
// into <div id="widgie">; see components/home/Reviews.tsx.

export const WIDGIE_URL = "https://widgie.vip/?ref=pgowp";
export const WIDGIE_WIDGET_ID = "88bfbcb1-5060-4dca-914c-33788e9850c2";
export const WIDGIE_SCRIPT = "https://widgie.pages.dev/review-widget.umd.js";
export const WIDGIE_STYLES = "https://widgie.pages.dev/style.css";
// The widget's look, as attributes on <div id="widgie"> (widgie's src/options.js lists them all): the dark theme on the
// site's raised-to-surface gradient, gold buttons, the site's font and the corners of its cards. heading="" hides the
// widget's own heading, since the section already has one.
export const WIDGIE_LOOK: Record<string, string> = {
    "bg-color": "linear-gradient(180deg, #16161f 0%, #0f0f16 100%)",
    theme: "dark",
    "accent-color": "#ffb02e",
    heading: "",
    radius: "1.5rem",
    font: "inherit",
};

// Google and Yelp reviews come from the owner's Widgie widget (https://widgie.vip). Its embed script mounts the widget
// into <div id="widgie">; see components/home/Reviews.tsx.

export const WIDGIE_URL = "https://widgie.vip/?ref=pgowp";
export const WIDGIE_WIDGET_ID = "88bfbcb1-5060-4dca-914c-33788e9850c2";
export const WIDGIE_SCRIPT = "https://widgie.pages.dev/review-widget.umd.js";
export const WIDGIE_STYLES = "https://widgie.pages.dev/style.css";
// The site's gold scale (gold.soft, gold, gold.deep in tailwind.config.js). The widget's text is always dark, so its
// background has to stay light.
export const WIDGIE_BACKGROUND = "linear-gradient(135deg, #ffd27a 0%, #ffb02e 55%, #e88f00 100%)";

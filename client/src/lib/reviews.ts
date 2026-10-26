import { useEffect, useSyncExternalStore } from "react";

// Google and Yelp reviews, kept up to date by Widgie (https://widgie.vip), the owner's review widget service. The build
// bakes the latest ones into the pages as window.__REVIEWS__ (see entry-server.tsx) so they're in the HTML search
// engines read, and the browser fetches them again once to pick up new ones.

export const WIDGIE_URL = "https://widgie.vip/?ref=pgowp";
const WIDGET_ID = "88bfbcb1-5060-4dca-914c-33788e9850c2";
// Widgie's public read-only API key, the same one its embed script uses. Set on Pages as a build variable.
const KEY = import.meta.env.VITE_SUPABASE_WIDGIE_KEY as string | undefined;
const API = `https://xjmbjuqypyphckrgpeib.supabase.co/rest/v1/widgets?id=eq.${WIDGET_ID}&select=yelpreviews,googlereviews,google_rating,yelp_rating,google_site,yelp_site,yelp_review_link`;
// Enough to fill the carousel without making every page heavy.
const MAX_REVIEWS = 24;

export interface Review {
    name: string;
    photo?: string;
    text: string;
    stars: number;
    source: "google" | "yelp";
}

export interface ReviewData {
    reviews: Review[];
    googleRating: number | null;
    yelpRating: number | null;
    googleUrl: string | null;
    yelpUrl: string | null;
    yelpReviewUrl: string | null;
}

declare global {
    interface Window {
        __REVIEWS__?: ReviewData;
    }
}

interface WidgieReview {
    name?: string;
    photo?: string;
    reviewtext?: string;
    stars?: number;
}

const rating = (value: unknown) => (typeof value === "number" && value > 0 && value <= 5 ? value : null);
const link = (value: unknown) => (typeof value === "string" && value.startsWith("https://") ? value : null);

function toReviews(list: unknown, source: Review["source"]): Review[] {
    return (Array.isArray(list) ? (list as WidgieReview[]) : [])
        .filter((r) => r?.name && r.reviewtext?.trim())
        .map((r) => ({
            name: String(r.name),
            photo: link(r.photo) ?? undefined,
            text: String(r.reviewtext).trim(),
            stars: Math.round(Number(r.stars) || 5),
            source,
        }));
}

export async function fetchReviews(): Promise<ReviewData | null> {
    if (!KEY) return null;
    try {
        const res = await fetch(API, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
        if (!res.ok) return null;
        const [row] = await res.json();
        if (!row) return null;
        const google = toReviews(row.googlereviews, "google");
        const yelp = toReviews(row.yelpreviews, "yelp");
        // Alternate the two sites so both show up near the start.
        const mixed: Review[] = [];
        for (let i = 0; mixed.length < MAX_REVIEWS && (i < google.length || i < yelp.length); i++) {
            if (google[i]) mixed.push(google[i]);
            if (yelp[i] && mixed.length < MAX_REVIEWS) mixed.push(yelp[i]);
        }
        return {
            reviews: mixed,
            googleRating: rating(row.google_rating),
            yelpRating: rating(row.yelp_rating),
            googleUrl: link(row.google_site),
            yelpUrl: link(row.yelp_site),
            yelpReviewUrl: link(row.yelp_review_link),
        };
    } catch {
        return null;
    }
}

let current: ReviewData | null = typeof window !== "undefined" ? (window.__REVIEWS__ ?? null) : null;
const listeners = new Set<() => void>();
let fetched = false;

export const getReviews = () => current;

export function setReviews(next: ReviewData | null) {
    if (!next || JSON.stringify(next) === JSON.stringify(current)) return;
    current = next;
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function useReviews() {
    const data = useSyncExternalStore(subscribe, getReviews, getReviews);
    useEffect(() => {
        if (fetched) return;
        fetched = true;
        fetchReviews().then(setReviews);
    }, []);
    return data;
}

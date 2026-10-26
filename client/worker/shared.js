// Helpers shared by every /api route in public/_worker.js. This folder sits next to public/ and dist/, so the
// worker's relative imports resolve the same way under `wrangler dev` and in the Pages build.

export const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://prestigiousgamingonwheelsplus.com",
    "https://www.prestigiousgamingonwheelsplus.com",
];

export function setCommonHeaders(headers, request) {
    if (request) {
        const origin = request.headers.get("Origin");
        if (origin && ALLOWED_ORIGINS.includes(origin)) {
            headers.set("Access-Control-Allow-Origin", origin);
        } else {
            headers.set("Access-Control-Allow-Origin", "null");
        }
    } else {
        headers.set("Access-Control-Allow-Origin", "*");
    }
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Content-Type", "application/json");
    return headers;
}

export function jsonResponse({ body, status = 200, request, added_headers }) {
    const headers = new Headers();
    setCommonHeaders(headers, request);

    const responseBody = body === null ? null : typeof body === "string" ? { message: body } : body;
    const ret_resp = new Response(responseBody === null ? null : JSON.stringify(responseBody), {
        status,
        headers,
    });

    if (added_headers) {
        added_headers.forEach((value, key) => {
            ret_resp.headers.append(key, value);
        });
    }

    return ret_resp;
}

// Visitor text goes into an HTML email, so it must never be able to add tags or links of its own.
export function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export const EMAIL_PATTERN = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

// Checks a Cloudflare Turnstile token from a public form, so bots can't use the endpoint.
export async function verifyTurnstile(token, request, env) {
    if (!env.TURNSTILE_SECRET) {
        console.error("TURNSTILE_SECRET is not set");
        return false;
    }
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET);
    form.append("response", token);
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) form.append("remoteip", ip);
    try {
        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: form,
        });
        const outcome = await res.json();
        if (!outcome.success) console.warn("Turnstile rejected:", outcome["error-codes"]);
        return outcome.success === true;
    } catch (error) {
        console.error("Turnstile verification failed:", error);
        return false;
    }
}

// Booking amounts are stored in cents.
export function dollars(cents) {
    const value = (cents ?? 0) / 100;
    return "$" + value.toLocaleString("en-US", { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

export function describeWhen(booking) {
    const start = new Date(booking.starts_at);
    const end = new Date(booking.ends_at);
    const fmt = { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" };
    const day = start.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
    return `${day}, ${start.toLocaleTimeString("en-US", fmt)} to ${end.toLocaleTimeString("en-US", fmt)}`;
}

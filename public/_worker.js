// import type { KVNamespace } from "@cloudflare/workers-types/experimental";
// import { createClient, SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// interface User extends SupabaseUser {
//     sub?: string;
// }

// interface AuthRequest extends Request {
//     user?: User;
// }

// interface Env {
//     KV: KVNamespace;
//     JWT_SECRET: string;
//     SUPABASE_SERVICE_ROLE: string;
//     STRIPE_SECRET_KEY: string;
//     NODE_ENV: string;
//     STRIPE_SECRET_TEST_KEY: string;
//     RESEND_KEY: string;
//     YELP_API_KEY: string;
//     ENDPOINT_SECRET: string;
//     LOCAL_ENDPOINT_SECRET: string;
//     TIKTOK_CLIENT: string;
// }

// interface Analytics {
//     followers: number;
//     engagement_rate: number;
//     avglikes: number;
//     avgcomments: number;
//     avgviews: number;
//     avgshares: number;
//     top_three_vids?: {
//         video_url: string;
//         thumbnail: string;
//         likes: number;
//         comments: number;
//         views: number;
//     }[];
//     lastrefreshed?: string;
// }

// Helper function to convert base64 URL to ArrayBuffer
function base64UrlToArrayBuffer(base64Url) {
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Function to verify the JWT signature using Web Crypto API
// async function verifyJwtSignature(token: string, secret: string): Promise<boolean> {
async function verifyJwtSignature(token, secret) {
    const [header, payload, signature] = token.split(".");

    // Reconstruct the data to verify (header + payload)
    const data = `${header}.${payload}`;

    // Convert secret and signature to ArrayBuffers
    const secretKey = new TextEncoder().encode(secret);
    const signatureArrayBuffer = base64UrlToArrayBuffer(signature);

    // Import the secret key
    const cryptoKey = await crypto.subtle.importKey("raw", secretKey, { name: "HMAC", hash: "SHA-256" }, false, [
        "verify",
    ]);

    // Verify the signature
    const isValid = await crypto.subtle.verify("HMAC", cryptoKey, signatureArrayBuffer, new TextEncoder().encode(data));

    return isValid;
}

// async function authenticateToken(request: AuthRequest, env: Env): Promise<Response | null> {
async function authenticateToken(request, env) {
    const authHeader = request.headers?.get("authorization");
    // console.log("authHeader:", authHeader);
    if (!authHeader) {
        return jsonResponse({ body: "Unauthorized", status: 401 });
    }
    const token = authHeader.split(" ")[1];
    // console.log("token:", token);

    if (!token) {
        return jsonResponse({ body: "Unauthorized", status: 401 });
    }

    // Decode the JWT
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) {
        return jsonResponse({ body: "Unauthorized", status: 401 });
    }

    const decodedHeader = JSON.parse(atob(header));
    if (decodedHeader.alg !== "HS256") {
        return jsonResponse({ body: "Unsupported JWT algorithm", status: 400 });
    }

    try {
        // const user = verify(token, env.JWT_SECRET as string) as SupabaseUser;
        // request.user = user;

        // Verify the JWT signature using Web Crypto API
        const isValid = await verifyJwtSignature(token, env.JWT_SECRET);
        if (!isValid) {
            return jsonResponse({ body: "Forbidden", status: 403 });
        }

        // Decode the payload to get the user
        const decodedPayload = JSON.parse(atob(payload));
        // const user = decodedPayload as SupabaseUser;
        const user = decodedPayload;
        request.user = user;
        return null;
    } catch (error) {
        console.error("Error verifying token:", error);
        return jsonResponse({ body: "Forbidden", status: 403 });
    }
}

// function setCommonHeaders(headers: Headers, request?: Request): Headers {
function setCommonHeaders(headers, request) {
    // console.log("request:", request);
    if (request) {
        const allowedOrigins = ["https://localhost:5173", "https://abimpact.co", "https://abetterinfluence.com"];

        const origin = request.headers.get("Origin");
        // console.log("origin:", origin);
        if (origin && allowedOrigins.includes(origin)) {
            console.log("setting origin:", origin);
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

// function jsonResponse({
//     body,
//     status = 200,
//     request,
//     added_headers,
// }: {
//     body: object | null | string;
//     status?: number;
//     request?: Request;
//     added_headers?: Headers;
// }): Response {
function jsonResponse({ body, status = 200, request, added_headers }) {
    const headers = new Headers();
    setCommonHeaders(headers, request);

    // console.log("headers are:", headers);

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

    // console.log("ret_resp:", ret_resp);

    return ret_resp;
}

export default {
    // async fetch(request: AuthRequest, env: Env): Promise<Response> {
    async fetch(request, env) {
        // console.log("env:", env);
        const url = new URL(request.url);
        // console.log("url:", url);
        if (url.pathname.startsWith("/api/")) {
            // console.log("req headers:", request.headers);
            if (request.method === "OPTIONS") {
                return jsonResponse({ body: null, request });
            }

            const supabase = createClient("https://jpbsmlujqqoemllljdsz.supabase.co", env.SUPABASE_SERVICE_ROLE, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                },
            });

            // console.log("url:", url, "\n\nrequest:", request);
            // console.log("request.method:", request.method, "\n\nurl.pathname:", url.pathname);

            return jsonResponse({ body: "Not Found", status: 404 });
        } else {
            return env.ASSETS?.fetch(request);
        }
    },
};

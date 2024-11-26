// import type { KVNamespace } from "@cloudflare/workers-types/experimental";
// import { createClient, SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Stripe from "stripe";

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

function setCommonHeaders(headers, request) {
    // console.log("request:", request);
    if (request) {
        const allowedOrigins = [
            "http://localhost:5173",
            "https://prestigiousgamingonwheelsplus.com",
            "https://www.prestigiousgamingonwheelsplus.com",
        ];

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

async function handleSendEmail(request, env) {
    const { from_name, user_email, message } = await request.json();

    const resend = new Resend(env.RESEND_KEY);

    const { error } = await resend.emails.send({
        from: "tbnd@prestigiousgamingonwheelsplus.com",
        to: "tbnd@prestigiousgamingonwheelsplus.com",
        subject: `New Message from ${from_name}`,
        html: `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
    <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
            href="https://fonts.googleapis.com/css2?family=Rethink+Sans:ital,wght@0,400..800;1,400..800&display=swap"
            rel="stylesheet"
        />
        <style>
            * {
                box-sizing: border-box;
                font-family: "Rethink Sans", sans-serif;
            }

            body {
                margin: 0;
                padding: 0;
            }

            a[x-apple-data-detectors] {
                color: inherit !important;
                text-decoration: inherit !important;
            }

            p {
                line-height: inherit;
            }

            .image_block img + div {
                display: none;
            }

            sup,
            sub {
                line-height: 0;
                font-size: 75%;
            }

            #memu-r1c1m0:checked ~ .menu-links {
                background-color: #000000 !important;
            }

            #memu-r1c1m0:checked ~ .menu-links a,
            #memu-r1c1m0:checked ~ .menu-links span {
                color: #ffffff !important;
            }

            @media (max-width: 670px) {
                .icons-inner {
                    text-align: center;
                }

                .icons-inner td {
                    margin: 0 auto;
                }

                .image_block div.fullWidth {
                    max-width: 100% !important;
                }

                .row-content {
                    width: 100% !important;
                }

                .stack .column {
                    width: 100%;
                    display: block;
                }

                .row-2 .column-1,
                .row-2 .column-2 {
                    padding: 5px !important;
                }
            }
        </style>
    </head>
    <body
        class="body"
        style="background-color: #000000; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none"
    >
        <table
            class="nl-container"
            width="100%"
            border="0"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #000000"
        >
            <tbody>
                <tr>
                    <td>
                        <table
                            class="row row-1"
                            align="center"
                            width="100%"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                        >
                            <tbody>
                                <tr>
                                    <td>
                                        <table
                                            class="row-content stack"
                                            align="center"
                                            border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                            role="presentation"
                                            style="
                                                mso-table-lspace: 0pt;
                                                mso-table-rspace: 0pt;
                                                border-radius: 0;
                                                color: #000000;
                                                width: 650px;
                                                margin: 0 auto;
                                            "
                                            width="650"
                                        >
                                            <tbody>
                                                <tr>
                                                    <td
                                                        class="column column-1"
                                                        width="100%"
                                                        style="
                                                            mso-table-lspace: 0pt;
                                                            mso-table-rspace: 0pt;
                                                            font-weight: 400;
                                                            text-align: left;
                                                            padding-bottom: 5px;
                                                            padding-top: 5px;
                                                            vertical-align: top;
                                                            border-top: 0px;
                                                            border-right: 0px;
                                                            border-bottom: 0px;
                                                            border-left: 0px;
                                                        "
                                                    >
                                                        <div
                                                            class="spacer_block block-1"
                                                            style="height: 25px; line-height: 25px; font-size: 1px"
                                                        >
                                                            &#8202;
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table
                            class="row row-2"
                            align="center"
                            width="100%"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                        >
                            <tbody>
                                <tr>
                                    <td>
                                        <table
                                            class="row-content"
                                            align="center"
                                            border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                            role="presentation"
                                            style="
                                                mso-table-lspace: 0pt;
                                                mso-table-rspace: 0pt;
                                                border-radius: 0;
                                                color: #000000;
                                                width: 650px;
                                                margin: 0 auto;
                                            "
                                            width="650"
                                        >
                                            <tbody>
                                                <tr>
                                                    <td
                                                        class="column column-1"
                                                        width="41.666666666666664%"
                                                        style="
                                                            mso-table-lspace: 0pt;
                                                            mso-table-rspace: 0pt;
                                                            font-weight: 400;
                                                            text-align: left;
                                                            padding-bottom: 5px;
                                                            padding-top: 5px;
                                                            vertical-align: middle;
                                                            border-top: 0px;
                                                            border-right: 0px;
                                                            border-bottom: 0px;
                                                            border-left: 0px;
                                                        "
                                                    >
                                                        <table
                                                            class="image_block block-1"
                                                            width="100%"
                                                            border="0"
                                                            cellpadding="15"
                                                            cellspacing="0"
                                                            role="presentation"
                                                            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                                                        >
                                                            <tr>
                                                                <td class="pad">
                                                                    <div
                                                                        class="alignment"
                                                                        align="left"
                                                                        style="line-height: 10px"
                                                                    >
                                                                        <div style="max-width: 54.167px">
                                                                            <a
                                                                                rel="noopener"
                                                                                href="https://prestigiousgamingonwheelsplus.com/"
                                                                                target="_blank"
                                                                                style="outline: none"
                                                                                tabindex="-1"
                                                                                ><img
                                                                                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gwVBjAsR+0+MQAACaFJREFUeNrtnHlwnWUVxn/Z2iRdSXGhtNJFgdIgSkEUCiNSgSqDIjMqnZHigIyDA1qGHZVVpyoUKIjYwog6B5EZRAdFMdi6TAuUVSwiA9ZaEiGkpE1aShKaPP5zbvzmepu8391yL7zPzPmL5n7c87zvWZ5zvgsREREREREREREREREREREREREREREREREREREREW8DCFANqAHUWCIb58/w543ht7Vhq5UxTkZjDhvn/x1ZeQgYD1oIOg+0rAR2NuhE0CGgfUETykmGO7JORouMWTLeL+OTMs6W8TUZyxJ2voyzZJwkY4H/+xYZ9SUiQ4Amgi4BtYO2gbqLbF2gl0AbQXeDLnLCp5SKiMRJnyLjAzKWyFgh47cynpXRLqNLRncO65LRIeN5GQ/IuE7G52QcJGNCkW+GAE0CXQHaCVKJbbc/52nQt0BHgpqKRYQ7p8ZP7UdlfFvGehmvyeiXMShDKWxQRp+MThl/kPENGR8uIhHDN+AK0I4yEJC0N0DrQeeCZvwvTxR04htlHCXjBhlPufNUJBuSsVPGwzK+KaNVRkOBRIwpAQINgV4B3QKaD6pNS0Iiqc6ScYGMDTLeKKLjc9l2vxFL/LblS8KYE5CxHaCfgg5OcxP8izfI+JCM22VsLbHjs2/Ei34bZuZJQsUQINDroFWg2aPlhETIaZBxop/GXWV0ftJelfF9GQfmQUJFESDQVtBl/v+Uk4Qs539CxjoZb46R8zO2Q8adMuZ5EVAyAgb9pPaOYq+DBvIk4RnQCXvKB1knf52M3WPs/IztlPEjGbNT3ITUBHSAVoMuB319BFsO+gloHehVT7ahBAx4KGrJvgWJMvMIGWsqyPnJ5LxcxvRAElIT8AToOO9mJ45gk0HTQAeAzgE96DcjlIS/gj6WJCARembJuKPASmfQe4N/emP2rIyNMl6Q0eMJNp/P3SXjfi8KakpBwAZvngIap8y/UYOXmD8A9aRIyJf437KotS3j/CaXC7rydHqXjLUybpJxjozPyPh4wk52SeJmGb+X8UrgLXtdxmMyrpVxpPcjjDEB/0fEPNB9gblhyEPYdBAv3/ruTOg5SsYjeTi/R8ZvZHxJxiEyJnrvUJPDamVMljFfxuky7vVOeDAHoTtkPCHjKnf8xMRNLUkOyIOA4efUg051zSnkFqwFHVJXu5ttq6biTlmRMvQMytgk4xp3aLColkj2s2Wc6Qm/38PTa36TLvF8NKVcfUCeBAw/aw7ofq+mRnvWRtAxU5u3sWXlTGQcI+PJlM5/SsbSfLvVxGkeL2OhjJ/LaPMw2FoETajsBLSAvhcYhjaBjj98zgZ0F00yLvNYG0rAP1zFbCxUOPO/r5cxV8b+xfjMsSJggjdafQHP+g/opPNOuAlvcH6Xojrp9FPaXCz5OBnbiy1Hl5OAaaAbA2/Ai6BFILxa6Qx0/hsuDUwv01SrGggYroT2B7UFNmbPgBZqLRNkXJlCWn5OxrFV4PyyEzAedJZ3xiFVUBvoIN3LDBn3BNbjA14pTcvH+YkQU1emuXCpCRg++U2u76wPrICGQHeA9tbdtMr4W+Dpb5dxSlrHJSSOJh9hnutC38QSk5CagMdBx7pDmwNsqnfBF4MeA/UHnv5e0LLpLR31uovj3LEhBKzxoXuQ0xLDnCkyjvYR5l98NvyMV16t3oM0pFQ6S0JAO+hW0IU+XB/JLgX9EPQw6LWUgtyToKP77hzf4FOnVwMHJKsz4WckRyVO/F7u+O94z7Az6zO7vQG7QcYZMhbJOMybuvcG2swRGsDUBGSG6tsDrCew3Mw1K74RNFm/otHDQXdg43W1x++cBGRtSxztyuXTORyfTewu15HaZWx2sh4KsDUybpPxrmIRUI4Z8SOZPKO7aZZxkcu8IUORr2aS5yhJdn8ZvyhQUR0KMLlWNKtaCOhw+bpx+ecvxhupUAI6ZXxxpDiddQOuCPzcQu3vHrZy3cqKImAbaEVGAe29fVKGgIsDHbXV1c6agPiPx+c7yzBLftFzR00lE9ANWgmam9mKSOj/FwQS0O/qZO1olUoiCS/wHmPH25WAIdBm0NWulNZkTcDG+aneGhiTv+vKJYEk1Mo42BNlqVZanncltaJC0JCHnAdAp7tGlGv+W+uLsi8HEnCPjP1S9gE1/jfnyvizK66DRSTgaRkHVAoBfaBOH7ac701aQ67OOhGrD5fxr8Av+6RPzUg5eMlo/gtkXOhLvFt8ktZfwIxYPqrcr1hV0IA7cEugveS6/kbQn7yJW+rjyQmBC1gHeDMU8mV7ZXw5s7OZpw7U7Lr/Yi8AVrsUvt5P8wv+nFACHpKxb7EI2AS6CnQaaEmgfQp0BGiWr6SPC9WS3CH7eLXyZmAzdu8IdXfafdNm75bfKWOGyxxLvRFTYGGwegRxMDUBj/luf10Kq813/TxxIi9K0TR1uHzRUEzdJnFDPp1Cm+rxKq65WAQUMJAp6Esv9pgc8qV3ewyfX0wl0z9rb19pGUgxmTt5hNK4agiYK+OXKZJhrwto+xSDhMSGxKm+zJUmAY+kzlYNAQ0+402T/Nq9oplWCAmJUvUwT8ah65ADMm4cZThU2QRkkXCo1+lpSsDNPs6cnXbClTUdO8J7jDRbGVs8X/BWIaBJxuV5CGjdMn7meWRyCq2ozmP+aTL+6BVNmp2ku2S8p+oJyHLKPF+MStsYDfjy7QrXZfaTMdX3e+qdlAYnucVvzKkuUWzK43mbvRKre0sQkKUNnZmiIsq1RLvJY/lyGV+R8QUPFWf4Yu5Kf+NmS57zggEZPw4sAKqOALwpuj5lPM4VInZ5Ut/uYWq7q6J9BUoPT/mmda0qYzu6JCQc6EmxX5X1gkanV16TKmg9vSQk1Po6eFuFvaJ0Wxo1tpoJyOSDE5yEvjF2/i4Z5rOFkr6kN+YE5GjQDvO18Z4xcn6vO39BYNyvfgKyiKjz8vRaH/8Nqnwvand51TQvD+dXPwFZt6FFxmdl3OfjxcESh5z1/p7ZvgVszFU/AVkk1PvOzzL/qZmOFMplyInf7mXmdcmX8QpdTZwEujLw52oeBx1VaQTsYar1Pm+yVsl4NM/GKvM663Myfi3jUv+5mr3yDDl7XBtfDLref7Xk5j3YLb4TOqdSCdjDjZgk44MuDVzjCfNBX8J91LcW/u3ywUYff7b5ZG2lD+uP94nY+CIv6A6vj9f5cHw0q6+U33/Lg4zM78S9w5PmoTI+4iLdKS5HLPIlgFZfqm3yJF9TJS98REREREREREREREREREREREREREREREREREREREREREREvH3xXxRG3nYOnZEqAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIyLTEyLTIxVDA2OjQ4OjQyKzAwOjAwWXVg6wAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMi0xMi0yMVQwNjo0ODo0MiswMDowMCgo2FcAAAAgdEVYdHNvZnR3YXJlAGh0dHBzOi8vaW1hZ2VtYWdpY2sub3JnvM8dnQAAABh0RVh0VGh1bWI6OkRvY3VtZW50OjpQYWdlcwAxp/+7LwAAABh0RVh0VGh1bWI6OkltYWdlOjpIZWlnaHQAMTkyQF1xVQAAABd0RVh0VGh1bWI6OkltYWdlOjpXaWR0aAAxOTLTrCEIAAAAGXRFWHRUaHVtYjo6TWltZXR5cGUAaW1hZ2UvcG5nP7JWTgAAABd0RVh0VGh1bWI6Ok1UaW1lADE2NTM1MDk5MjkS+VQKAAAAD3RFWHRUaHVtYjo6U2l6ZQAwQkKUoj7sAAAAVnRFWHRUaHVtYjo6VVJJAGZpbGU6Ly8vbW50bG9nL2Zhdmljb25zLzIwMjItMDUtMjUvY2NiNDMxMTc4NjdkOGU3MmE2NWRkM2U2M2JiYjUxZDIuaWNvLnBuZ7auyVgAAAAASUVORK5CYII="
                                                                                    style="
                                                                                        display: block;
                                                                                        height: auto;
                                                                                        border: 0;
                                                                                        width: 100%;
                                                                                    "
                                                                                    width="54.167"
                                                                                    alt="Company logo"
                                                                                    title="Company logo"
                                                                                    height="auto"
                                                                            /></a>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                    <td
                                                        class="column column-2"
                                                        width="58.333333333333336%"
                                                        style="
                                                            mso-table-lspace: 0pt;
                                                            mso-table-rspace: 0pt;
                                                            font-weight: 400;
                                                            text-align: left;
                                                            padding-bottom: 5px;
                                                            padding-top: 5px;
                                                            vertical-align: middle;
                                                            border-top: 0px;
                                                            border-right: 0px;
                                                            border-bottom: 0px;
                                                            border-left: 0px;
                                                        "
                                                    >
                                                        <table
                                                            class="menu_block block-1"
                                                            width="100%"
                                                            border="0"
                                                            cellpadding="10"
                                                            cellspacing="0"
                                                            role="presentation"
                                                            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                                                        >
                                                            <tr>
                                                                <td class="pad">
                                                                    <table
                                                                        width="100%"
                                                                        cellpadding="0"
                                                                        cellspacing="0"
                                                                        border="0"
                                                                        role="presentation"
                                                                        style="
                                                                            mso-table-lspace: 0pt;
                                                                            mso-table-rspace: 0pt;
                                                                        "
                                                                    >
                                                                        <tr>
                                                                            <td
                                                                                class="alignment"
                                                                                style="
                                                                                    text-align: right;
                                                                                    font-size: 0px;
                                                                                "
                                                                            >
                                                                                <div class="menu-links">
                                                                                    <a
                                                                                        href="https://app.10to8.com/book/ymonerhexbfwnegoml/"
                                                                                        target="_blank"
                                                                                        style="
                                                                                            padding-top: 5px;
                                                                                            padding-bottom: 5px;
                                                                                            padding-left: 5px;
                                                                                            padding-right: 20px;
                                                                                            display: inline-block;
                                                                                            color: #ffffff;
                                                                                            font-size: 16px;
                                                                                            text-decoration: none;
                                                                                            letter-spacing: normal;
                                                                                        "
                                                                                        rel="noopener"
                                                                                        >Book Now</a
                                                                                    >
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table
                            class="row row-6"
                            align="center"
                            width="100%"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                        >
                            <tbody>
                                <tr>
                                    <td>
                                        <table
                                            class="row-content stack"
                                            align="center"
                                            border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                            role="presentation"
                                            style="
                                                mso-table-lspace: 0pt;
                                                mso-table-rspace: 0pt;
                                                border-radius: 0;
                                                color: #000000;
                                                width: 650px;
                                                margin: 0 auto;
                                            "
                                            width="650"
                                        >
                                            <tbody>
                                                <tr>
                                                    <td
                                                        class="column column-1"
                                                        width="100%"
                                                        style="
                                                            mso-table-lspace: 0pt;
                                                            mso-table-rspace: 0pt;
                                                            font-weight: 400;
                                                            text-align: left;
                                                            padding-bottom: 5px;
                                                            padding-top: 5px;
                                                            vertical-align: top;
                                                            border-top: 0px;
                                                            border-right: 0px;
                                                            border-bottom: 0px;
                                                            border-left: 0px;
                                                        "
                                                    >
                                                        <table
                                                            class="paragraph_block block-1"
                                                            width="100%"
                                                            border="0"
                                                            cellpadding="10"
                                                            cellspacing="0"
                                                            role="presentation"
                                                            style="
                                                                mso-table-lspace: 0pt;
                                                                mso-table-rspace: 0pt;
                                                                word-break: break-word;
                                                            "
                                                        >
                                                            <tr>
                                                                <td class="pad">
                                                                    <div
                                                                        style="
                                                                            color: #adadad;
                                                                            direction: ltr;
                                                                            font-family: Fira Sans, Lucida Sans Unicode,
                                                                                Lucida Grande, sans-serif;
                                                                            font-size: 18px;
                                                                            font-weight: 400;
                                                                            letter-spacing: 0px;
                                                                            line-height: 180%;
                                                                            text-align: left;
                                                                        "
                                                                    >
                                                                        <h1>New Message from ${from_name}</h1>
                                                                        <p style="margin: 0">
                                                                        ${message}
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    </body>
            </html>`,
        replyTo: user_email,
    });

    if (error) {
        console.error("Error sending email:", error);
        return jsonResponse({ body: error.message, status: 400 });
    }
    console.log("Email sent successfully to:", user_email);
    return jsonResponse({ body: null, status: 204 });
}

async function handleCreateCheckoutSession(request, stripe) {
    const { email, redirect_to, items } = await request.json();
    const origin = request.headers.get("Origin");
    console.log("origin:", origin);
    const finishedUrl = origin + redirect_to;

    try {
        let products = [];
        // console.log("items:", items);
        const item_titles = items.map((item) => item.title);
        console.log("item_titles:", item_titles);
        for await (const product of stripe.products.list()) {
            // console.log("product:", product);
            if (item_titles.includes(product.name)) {
                products.push({ name: product.name, default_price: product.default_price });
                if (products.length === item_titles.length) break;
            }
        }
        console.log("final products:", products, "\n\nproducts.length:", products.length);

        const session = await stripe.checkout.sessions.create({
            line_items: items.map((item) => {
                const product = products.find((prod) => prod.name === item.title);
                return {
                    price: product.default_price,
                    quantity: 1,
                };
            }),
            customer_email: email,
            mode: "payment",
            success_url: `${finishedUrl}?success=true`,
            cancel_url: `${finishedUrl}?canceled=true`,
        });

        return jsonResponse({ body: { url: session.url } });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return jsonResponse({ body: { error: "Internal Server Error" }, status: 500 });
    }
}

export default {
    async fetch(request, env) {
        // console.log("env:", env);
        const url = new URL(request.url);
        // console.log("url:", url);
        if (url.pathname.startsWith("/api/")) {
            // console.log("req headers:", request.headers);
            if (request.method === "OPTIONS") {
                return jsonResponse({ body: null, request });
            }

            const stripe = new Stripe(
                env.NODE_ENV === "development" ? env.STRIPE_SECRET_TEST_KEY : env.STRIPE_SECRET_KEY
            );
            const supabase = createClient("https://jpbsmlujqqoemllljdsz.supabase.co", env.SUPABASE_SERVICE_ROLE, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                },
            });

            // console.log("url:", url, "\n\nrequest:", request);
            // console.log("request.method:", request.method, "\n\nurl.pathname:", url.pathname);

            if (request.method === "POST") {
                if (url.pathname === "/api/send-email") return handleSendEmail(request, env);
                else if (url.pathname === "/api/create-checkout-session")
                    return handleCreateCheckoutSession(request, stripe);
            }

            return jsonResponse({ body: "Not Found", status: 404 });
        } else {
            return env.ASSETS?.fetch(request);
        }
    },
};

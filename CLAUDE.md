# Prestigious Gaming on Wheels Plus

Marketing site for a Queens, NY video game truck and laser tag party business:
https://prestigiousgamingonwheelsplus.com. Phone (718) 673-8529.

## Layout

- `client/`: the public site. Vite + React 18 + TypeScript + Tailwind, deployed to Cloudflare Pages.
- `client/public/_worker.js`: Cloudflare Pages advanced-mode worker. Serves the static build and handles `/api/*`
  (`send-email` for the contact form, plus the Stripe `create-checkout-session` / `verify-purchase` routes).
- `management/`: separate internal admin app (Supabase auth). Not deployed with the public site.
- The READMEs in `client/` and `management/` are leftover Create React App boilerplate. Ignore them.

## Commands (run in `client/`)

- `npm run dev`: Vite dev server on port 5173.
- `npm run start:worker`: `wrangler dev` for `_worker.js` on 127.0.0.1:8787. In dev, `apilink` in
  `src/GlobalFunctions.ts` points here, and the worker's CORS only allows `localhost:5173`.
- `npm run build`: type check, client build, SSR build, then `scripts/prerender.mjs`. This writes one static HTML
  file per route in `PAGES`, plus `sitemap.xml`, `404.html` and the client-only shells for `/book`, `/checkout`,
  `/checkout-details` and `/e-invites`.
- `npx vitest run`: unit tests (`src/lib/invite.test.ts`).

Cloudflare Pages builds and deploys on every push to `master`.

## Where things live

- `src/site.ts` is the source of truth for business details, nav links, service areas and the `PAGES` map (title,
  description, path). A route must be in `PAGES` to be prerendered and listed in the sitemap.
- `src/seo.ts` builds the `<head>` tags and JSON-LD (business, breadcrumbs, FAQ) for each page. `Seo.tsx` keeps them
  in sync during client-side navigation.
- `src/data/`: packages and prices, FAQs, photos and the service-area landing pages (`areas.ts`). Edit copy and prices
  here, not in the screens.
- Routes are in `src/components/global/Routing.tsx`. The in-site booking and Stripe flow is dev only. In production,
  `BookButton` links to 10to8 (`SITE.bookingUrl`, with an optional per-package `service` id).
- `/bday-card` makes birthday e-invites fully in the browser (`src/lib/invite.ts`).

## Production environment (Cloudflare Pages)

- The worker reads `RESEND_KEY` (contact email via Resend), `TURNSTILE_SECRET` (contact form spam check) and
  `SUPABASE_SERVICE_ROLE`. There is no `STRIPE_SECRET_KEY` in production, so Stripe and Supabase clients must only be
  created inside the routes that use them. Creating them up front once crashed every `/api` call.
- The Turnstile site key is public and lives in `SITE.turnstileSiteKey`. Dev uses Cloudflare's always-pass test key.
- Contact email goes from and to tbnd@prestigiousgamingonwheelsplus.com. The domain's mail is on Microsoft 365.

## Conventions

- Files use CRLF line endings. Keep them CRLF. `sed -i` silently converts files to LF.
- Contact form input is escaped before it goes into the email HTML. Keep it that way for any new fields.
- Site copy should stay factual: don't invent claims about the business such as party counts, awards or exact travel
  fees.

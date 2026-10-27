# Prestigious Gaming on Wheels Plus

Marketing site for a Queens, NY video game truck and laser tag party business:
https://prestigiousgamingonwheelsplus.com. Phone (718) 673-8529.

## Layout

- `client/`: the public site. Vite + React 18 + TypeScript + Tailwind, deployed to Cloudflare Pages.
- `client/public/_worker.js`: Cloudflare Pages advanced-mode worker. Serves the static build and handles `/api/*`:
  `send-email` for the contact form, everything else is routed to `client/worker/booking.js`.
- `client/worker/`: worker modules (online booking, booking emails, shared helpers). They sit outside `public/`; Pages
  bundles `_worker.js` from the repo checkout, so `../worker/*` and `../src/lib/booking.ts` imports resolve.
- `client/migrations/`: Cloudflare D1 schema for bookings.
- `management/`: old internal admin app pointing at a Supabase project that no longer exists. Not deployed. The owner
  dashboard is `/admin` on the public site.
- The READMEs in `client/` and `management/` are leftover Create React App boilerplate. Ignore them.

## Commands (run in `client/`)

- `npm run dev`: Vite dev server on port 5173.
- `npm run start:worker`: `wrangler dev -c wrangler.dev.toml` on 127.0.0.1:8787 with a local D1 database. Secrets go
  in `.dev.vars` (copy `.dev.vars.example`). In dev, `apilink` in `src/GlobalFunctions.ts` points here, and the
  worker's CORS only allows `localhost:5173`.
- `npm run db:migrate:local`: apply `migrations/` to the local D1 database.
- `npm run build`: type check, client build, SSR build, then `scripts/prerender.mjs`. This writes one static HTML
  file per route in `PAGES`, plus `sitemap.xml`, `404.html` and the client-only shells for `APP_ROUTES` in
  `src/site.ts` (`/book`, `/book/confirmed`, `/admin`, `/e-invites`).
- `npx vitest run`: unit tests (`src/lib/invite.test.ts`, `src/lib/booking.test.ts`, `src/lib/catalog.test.ts`).

Cloudflare Pages builds and deploys on every push to `master`.

## Where things live

- `src/site.ts` is the source of truth for business details, nav links, service areas and the `PAGES` map (title,
  description, path). A route must be in `PAGES` to be prerendered and listed in the sitemap.
- `src/seo.ts` builds the `<head>` tags and JSON-LD (business, breadcrumbs, FAQ) for each page. `Seo.tsx` keeps them
  in sync during client-side navigation.
- `src/data/`: default packages and prices, FAQs, photos and the service-area landing pages (`areas.ts`). Edit copy
  here, not in the screens. Live prices are edited on `/admin` (see Online booking).
- Routes are in `src/components/global/Routing.tsx`. `BookButton` links to `/book` (with `?package=<id>` to preselect).

## Online booking (replaced 10to8 in Oct 2026)

- `/book` (`BookParty.tsx`): package, add-ons, date and time, details. Only the package deposit is charged online, through
  Stripe Checkout. Add-ons and the balance are paid on the day, as they were on 10to8. The Stripe Checkout line item
  (`handleCheckout` in `worker/booking.js`) tells customers the balance is preferably paid in cash.
- `src/lib/booking.ts` holds pricing, deposits, New York time zone maths and open-slot rules. Both the page and the
  worker use it, and the worker recomputes every amount from ids.
- Prices, deposits, packages and add-ons are the live price list (`src/lib/catalog.ts`): managers edit it on `/admin`
  (Prices & packages), and it's saved in the D1 `catalog` table. `src/data/packages.ts` only holds the defaults used
  until a list is saved. Pages read it through `useCatalog()`. The build bakes the live list into every page
  (`loadSiteData` in `entry-server.tsx`) and browsers fetch `/api/booking/catalog` again, so a change shows straight away
  and reaches the static HTML on the next deploy. Package and add-on ids are saved on bookings: never rename one.
- Checkout inserts a `pending` booking that holds the slot for 35 minutes, then opens Stripe Checkout. The booking
  becomes `confirmed` from the `checkout.session.completed` webhook (`/api/stripe/webhook`) or from
  `/book/confirmed` asking `/api/booking/status`, whichever comes first. Confirmation emails are sent once.
- `/admin` (`Admin.tsx`): bookings dashboard. Bookings, manual bookings (phone, school and corporate events), weekly
  hours, gap between parties, capacity, time off and the team. The owner signs in with `ADMIN_PASSWORD`. Managers
  (the `staff` table, e.g. Tricia, who runs day-to-day booking) sign in with a one-time link emailed through Resend,
  and can do everything the owner can. Sessions and the owner's feed link are signed with `BOOKING_SECRET`, falling
  back to the Pages project's existing `JWT_SECRET`.
- Calendars: everyone on the team (managers and workers) has their own random feed link
  (`/api/booking/calendar.ics?token=`). The dashboard texts them a `/calendar?token=` page with Apple and Google
  Calendar buttons. Google refreshes subscribed calendars only every several hours; Apple is quicker.
- The business never takes Thursday parties: Thursday is closed in `DEFAULT_SETTINGS` and in the saved settings.
- Emails: every new online booking and booking problem goes to tbnd@ and every manager with an email. Customers get a
  reminder the day before (`/api/booking/send-reminders`, at most once per booking, only 8 AM to 9 PM New York time).
  The separate `pgowp-reminders` Worker (`cron/reminders.js`, `wrangler.cron.toml`) calls it every morning; deploy it
  with `npx wrangler deploy -c wrangler.cron.toml`. In dev, reminders and sign-in links are logged instead of emailed.
- Reviews are the owner's Widgie widget (https://widgie.vip), embedded with its own script in `Reviews.tsx`. Its
  stylesheet carries Tailwind's global reset, so it's imported into a cascade layer that the site's styles override,
  and `#widgie * { all: revert-layer }` in `index.css` hands the widget's own elements back to it. Its look (dark
  theme, gold accent, the site's font) is the `WIDGIE_LOOK` attributes in `src/lib/reviews.ts`; the widget's source is
  the owner's `nathanuel0322/widgie` repo, which lists every attribute in `src/options.js`. The site promotes widgie
  on purpose (badge under the reviews, footer credit): keep those links.
- `/bday-card` makes birthday e-invites fully in the browser (`src/lib/invite.ts`).

## Production environment (Cloudflare Pages)

- Bindings and secrets: D1 database bound as `DB`, `RESEND_KEY` (emails via Resend), `TURNSTILE_SECRET` (contact,
  booking and admin sign-in spam check), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BOOKING_SECRET` and
  `ADMIN_PASSWORD`. Create the Stripe client only inside the routes that use it: creating it up front once crashed
  every `/api` call when the key was missing. Booking routes return 503 if `DB` isn't bound.
- `STRIPE_SECRET_KEY` must be the live secret key (`sk_live_…`, or a restricted `rk_live_…`). In Oct 2026 a non-Stripe
  value was saved there, and every "Pay deposit" failed with a generic "We couldn't start checkout" toast.
- Secret and variable changes only reach new deployments. After changing one, redeploy: "Retry deployment" on the
  latest production deployment in the dashboard, or push a commit (an empty one is fine).
- Live API errors: get the current deployment id from `npx wrangler pages deployment list --project-name pgowp`, then
  stream its logs with `npx wrangler pages deployment tail <id> --project-name pgowp --format pretty` (the id is
  required outside an interactive terminal). The booking page's error toasts don't always show the real cause.
- The Turnstile site key is public and lives in `SITE.turnstileSiteKey`. Dev uses Cloudflare's always-pass test key.
- Contact email goes from and to tbnd@prestigiousgamingonwheelsplus.com. The domain's mail is on Microsoft 365.
- Live Stripe webhook: `website-booking-deposits` in Stripe Workbench, pointing at
  `https://prestigiousgamingonwheelsplus.com/api/stripe/webhook` for `checkout.session.completed`,
  `checkout.session.expired` and `checkout.session.async_payment_succeeded`. Its signing secret is
  `STRIPE_WEBHOOK_SECRET` in Pages.
- Payment testing must cost nothing: Stripe sandbox (`sk_test_` key in `.dev.vars`) and test card
  4242 4242 4242 4242 only. Never run a real-card charge or refund against the live site.

## Secrets across machines (work happens on several PCs and Macs)

- The live site's secrets are stored in Cloudflare Pages, not on any computer. Pushing from any machine deploys with
  them, so nothing needs copying for production. Change them with
  `npx wrangler pages secret put NAME --project-name pgowp` or in the Cloudflare dashboard. Never commit secret
  values, including to this file.
- On each computer, run `npx wrangler login` once. It signs that machine in to Cloudflare, which D1 and secrets
  commands need.
- Local test settings live in `client/.dev.vars`, which is gitignored on purpose. The owner keeps its contents in a
  password manager secure note and pastes it into the same file on each new machine. It holds test values only
  (`sk_test_…`), never the live Stripe key. `client/.dev.vars.example` lists every setting.
- New machine setup: `git clone`, `npm install` in `client/`, create `client/.dev.vars` from the secure note,
  `npx wrangler login`, then `npm run db:migrate:local`.
- Claude must not type or handle secret values. The owner enters keys and passwords themselves.

## Conventions

- The root font size is 110% (`index.css`), so the whole site renders about like 110% browser zoom. That only works
  because sizes are in rem: use Tailwind's scale or `text-[0.9375rem]`, never `text-[15px]` or other px font sizes.
  Because of the larger size, the full desktop nav shows from `xl` (1280px); below that the header uses the menu button.
- Files use CRLF line endings. Keep them CRLF. `sed -i` silently converts files to LF.
- Contact form and booking input is escaped before it goes into email HTML. Keep it that way for any new fields.
- Site copy should stay factual: don't invent claims about the business such as party counts, awards or exact travel
  fees.

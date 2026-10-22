# PGOW Plus website

Site for Prestigious Gaming on Wheels Plus, hosted on Cloudflare Pages. The React app is in `client/`, and the
Pages worker is `client/public/_worker.js` (CRLF line endings; keep them). Online booking replaced 10to8; how it
works is in [BOOKING.md](BOOKING.md).

## In progress: Cloudflare setup for online booking

The booking code is finished and tested locally, but the Cloudflare and Stripe setup below hasn't been done yet.
**Don't deploy (push to master) until steps 1–4 are done**: deploying switches every Book button from 10to8 to the
new booking page.

Walk the user through these one step at a time, waiting for them to finish each step before giving the next. Tick
each box here as it's done.

- [x] **1. Create the database.** dash.cloudflare.com → Storage & databases → D1 SQL database → Create.
      Name `pgowp-bookings`; location Eastern North America if it asks, otherwise Automatic. Leave it empty: the
      site creates its tables the first time it uses the database.
- [x] **2. Connect it to the site.** Workers & Pages → the site's Pages project → Settings → Bindings → Add →
      D1 database. Variable name `DB`, database `pgowp-bookings`. Add it for Production (and Preview, if preview
      deploys are used).
- [ ] **3. Stripe webhook.** Waiting on access to the Stripe account; steps 4 and 5 are blocked until it's done.
      Use the Stripe account 10to8 pays into (`acct_1JPFx7IO67Spu8tm`).
      - Check `STRIPE_SECRET_KEY` in Cloudflare is that account's live secret key.
      - Developers → Webhooks → Add endpoint `https://prestigiousgamingonwheelsplus.com/api/stripe-webhook`, events
        `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its signing secret.
- [ ] **4. Secrets.** Pages project → Settings → Variables and secrets (Production), added as encrypted secrets:
      - [x] `ADMIN_PASSWORD`: password for `/admin`, at least 10 characters (a few random words works well)
      - [ ] `STRIPE_WEBHOOK_SECRET`: the signing secret from step 3 (the only one left)
      - [x] `CALENDAR_TOKEN`: a long random string, e.g. from `openssl rand -hex 24`
      - Already set and still needed: `STRIPE_SECRET_KEY`, `RESEND_KEY`, `TURNSTILE_SECRET`
      - Optional: `NOTIFY_EMAIL` (new-request alerts; defaults to tbnd@prestigiousgamingonwheelsplus.com)
      - No longer used, safe to delete: `SUPABASE_SERVICE_ROLE`, `VITE_SUPABASE_KEY`
- [ ] **5. Deploy.** Pull first (origin/master had a commit this machine didn't), then push master. Sign in at
      `/admin` with `ADMIN_PASSWORD` and check the dashboard loads.

After that, "Moving over from 10to8" in BOOKING.md: copy upcoming 10to8 bookings into `/admin` → Add booking, block
days off, subscribe to the calendar link, make one real test booking (book, pay, approve, cancel with refund), then
cancel the 10to8 subscription.

## Notes

- Bookings are stored in Cloudflare D1 (`client/src/booking/d1.ts`). The old Supabase project
  (`awqealatvcaezaddnten`) is permanently paused and nothing uses it.
- Tests: `cd client && npx vitest run`. Build: `cd client && npm run build`.
- Run the worker locally against a local D1 database:
  `cd client && npm run build && npx wrangler pages dev dist --port 8787 --d1 DB=pgowp-local --binding ADMIN_PASSWORD="local test password" --binding TURNSTILE_SECRET=1x0000000000000000000000000000000AA`

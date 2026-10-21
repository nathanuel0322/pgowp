# Online booking (replaces 10to8)

Customers book at `/book`: pick a package, add-ons, guests and extra time, choose an open start time, enter their
details and pay the deposit through Stripe. The booking comes in as **Needs approval** (as every 10to8 booking did).
Approving or declining it at `/admin` emails the customer; declining refunds the deposit automatically.

| Where | What |
| --- | --- |
| `client/src/data/packages.ts` | Prices, deposits, how long each party blocks the calendar, add-ons |
| `client/src/booking/schedule.ts` | Open-time rules. Default hours match 10to8: Fri 12:00–8:30 PM, Sat 10 AM–10 PM, Sun 5:30–10:30 PM, 2 crews, 1 hour between parties, 24 hours' notice |
| `client/src/booking/server.ts` | The API the worker runs: availability, Stripe checkout, webhook, admin sign-in, calendar feed, emails |
| `client/src/booking/d1.ts` | The database (Cloudflare D1). Its tables are created automatically the first time the site uses it |
| `client/src/screens/Book.tsx`, `BookConfirmed.tsx`, `Admin.tsx` | Booking page, thank-you page, admin page |

Hours, crews, the gap between parties, notice and booking window can all be changed on the admin page later
(Hours & settings). Prices and packages are changed in `packages.ts`.

## One-time setup, before deploying

Deploying this code switches every Book button from 10to8 to the new page, so do these first. Everything is in the
Cloudflare account that already hosts the site, plus Stripe.

1. **Database.** Cloudflare dashboard → Storage & databases → D1 → Create database, named `pgowp-bookings`. Leave it
   empty; the site creates its tables on first use.
2. **Connect it to the site.** Workers & Pages → the site's Pages project → Settings → Bindings → Add → D1 database.
   Variable name `DB`, database `pgowp-bookings`. Do this for Production (and Preview, if you use preview deploys).
3. **Stripe.** Use the Stripe account 10to8 pays into (`acct_1JPFx7IO67Spu8tm`), so deposits keep landing in the same place.
   - Make sure `STRIPE_SECRET_KEY` in Cloudflare is that account's live secret key.
   - Developers → Webhooks → Add endpoint: `https://prestigiousgamingonwheelsplus.com/api/stripe-webhook`, events
     `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its signing secret.
4. **Pages project → Settings → Variables and secrets** (Production). Add these as secrets (Encrypt):
   - `ADMIN_PASSWORD`: the password for `/admin`, at least 10 characters. A few random words works well, e.g.
     `purple trailer jumps fridays`. Sign-in stays off until it's set.
   - `STRIPE_WEBHOOK_SECRET`: the signing secret from step 3
   - `CALENDAR_TOKEN`: any long random string, e.g. the output of `openssl rand -hex 24` (turns on the calendar feed)
   - Already used by the site and still needed: `STRIPE_SECRET_KEY`, `RESEND_KEY`, `TURNSTILE_SECRET`
   - Optional: `NOTIFY_EMAIL` (where new-request alerts go; defaults to tbnd@prestigiousgamingonwheelsplus.com)
   - No longer used, safe to delete: `SUPABASE_SERVICE_ROLE`, `VITE_SUPABASE_KEY`
5. **Deploy**, then sign in at `/admin` with the password from step 4.

## Admin sign-in

`/admin` has one shared password, `ADMIN_PASSWORD`. Each browser stays signed in for 30 days. Every attempt has to pass
the Turnstile spam check, and failed attempts are logged in the Pages project's logs.

- **Forgot the password, or a phone with it signed in was lost:** set a new `ADMIN_PASSWORD` in Cloudflare and
  redeploy. Changing it signs out every device.
- **Extra protection (optional, free):** Cloudflare Zero Trust → Access → add an application for
  `prestigiousgamingonwheelsplus.com/admin*` and `/api/admin/*`, allowing only your email addresses. Cloudflare then
  emails a one-time code before the page even loads.

## Backups

D1 keeps its own history: in the dashboard (D1 → `pgowp-bookings` → Time Travel) the database can be put back to any
minute in the last 7 days on the free plan, 30 on the paid one. To keep a copy of your own:

```bash
npx wrangler d1 export pgowp-bookings --remote --output bookings-backup.sql
```

## Moving over from 10to8

1. Before turning 10to8 off, copy every upcoming 10to8 booking into `/admin` → **Add booking** (fill in "Paid so far"
   with the deposit they already paid). That blocks those times on the new calendar.
2. Block holidays and days off under **Time off**.
3. Subscribe to the calendar link under **Hours & settings** in Google Calendar or on the iPhone, replacing 10to8's
   calendar sync.
4. Make one real test booking end to end (book, pay, approve, then cancel with a refund).
5. Cancel the 10to8 subscription.

## Not carried over from 10to8

- Text-message reminders. Customers get emails instead, and the confirmation email includes a calendar file that
  adds the party (with its own reminder) to their phone.
- Customers rescheduling or cancelling themselves. They call or reply to the email, and the change is made in `/admin`.
- The "Laser Tag On a Budget / Option B" package and the Block Party listing, which aren't on the website's
  packages page. Add them to `PARTY_PACKAGES` in `packages.ts` to sell them online.
- School and corporate events stay "call for a quote", as on the website.

## The old Supabase project

The site used to keep its (unfinished) checkout and the `management` app's logins in Supabase project
`awqealatvcaezaddnten`. It has been paused since December 2024 and can no longer be restored, and nothing in the new
booking system uses it. The Supabase dashboard still offers a backup download if that old data is ever needed.

# Online booking (replaces 10to8)

Customers book at `/book`: pick a package, add-ons, guests and extra time, choose an open start time, enter their
details and pay the deposit through Stripe. The booking comes in as **Needs approval** (as every 10to8 booking did).
Approving or declining it at `/admin` emails the customer; declining refunds the deposit automatically.

| Where | What |
| --- | --- |
| `client/src/data/packages.ts` | Prices, deposits, how long each party blocks the calendar, add-ons |
| `client/src/booking/schedule.ts` | Open-time rules. Default hours match 10to8: Fri 12:00–8:30 PM, Sat 10 AM–10 PM, Sun 5:30–10:30 PM, 2 crews, 1 hour between parties, 24 hours' notice |
| `client/src/booking/server.ts` | The API the worker runs: availability, Stripe checkout, webhook, admin, calendar feed, emails |
| `client/src/screens/Book.tsx`, `BookConfirmed.tsx`, `Admin.tsx` | Booking page, thank-you page, admin page |
| `supabase/bookings.sql` | Database tables |

Hours, crews, the gap between parties, notice and booking window can all be changed on the admin page later
(Hours & settings). Prices and packages are changed in `packages.ts`.

## One-time setup, before deploying

Deploying this code switches every Book button from 10to8 to the new page, so do these first.

1. **Database.** In Supabase (project `awqealatvcaezaddnten`): SQL Editor → New query → paste `supabase/bookings.sql` → Run.
2. **Stripe.** Use the Stripe account 10to8 pays into (`acct_1JPFx7IO67Spu8tm`), so deposits keep landing in the same place.
   - Make sure `STRIPE_SECRET_KEY` in Cloudflare is that account's live secret key.
   - Developers → Webhooks → Add endpoint: `https://prestigiousgamingonwheelsplus.com/api/stripe-webhook`, events
     `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its signing secret.
3. **Cloudflare Pages → Settings → Variables and secrets** (Production):
   - `STRIPE_WEBHOOK_SECRET`: the signing secret from step 2 (new)
   - `CALENDAR_TOKEN`: any long random string, e.g. the output of `openssl rand -hex 24` (new; turns on the calendar feed)
   - `VITE_SUPABASE_KEY`: the Supabase **anon / publishable** key, so the admin page can sign in (build variable)
   - Already used by the site and still needed: `SUPABASE_SERVICE_ROLE`, `STRIPE_SECRET_KEY`, `RESEND_KEY`, `TURNSTILE_SECRET`
   - Optional: `ADMIN_EMAILS` (comma-separated; defaults to tbnd@prestigiousgamingonwheelsplus.com),
     `NOTIFY_EMAIL` (where new-request alerts go; same default)
4. **Supabase → Authentication → URL Configuration:** add `https://prestigiousgamingonwheelsplus.com/admin` to the
   redirect URLs, so "Forgot password?" on the admin page works.
5. **Deploy**, then sign in at `/admin` with the tbnd@ account (the same login as the old management app).

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

## Old tables

The old, unfinished checkout read a `parties` table straight from the browser. Nothing uses it or `availability`
any more. If either holds real customer data, turn on row level security for it or drop it in Supabase.

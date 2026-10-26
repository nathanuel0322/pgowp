// Cloudflare Worker that runs every morning and asks the site to send the day-before reminder emails. Pages projects
// can't run on a schedule, so this Worker only does the timing; /api/booking/send-reminders (worker/booking.js) does
// the work. Deploy it with `npx wrangler deploy -c wrangler.cron.toml`.
const REMINDERS_URL = "https://prestigiousgamingonwheelsplus.com/api/booking/send-reminders";

export default {
    async scheduled() {
        const res = await fetch(REMINDERS_URL, { method: "POST" });
        const body = await res.text();
        // Throwing marks the run as failed in the Cloudflare dashboard.
        if (!res.ok) throw new Error(`Reminders failed (${res.status}): ${body}`);
        console.log(`Reminders: ${body}`);
    },
};

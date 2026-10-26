// Emails sent through Resend: the customer's confirmation and day-before reminder, the team's copy of each booking and
// managers' sign-in links. Every entered value goes through escapeHtml before it reaches the HTML.
import { Resend } from "resend";
import { describeWhen, dollars, escapeHtml } from "./shared.js";

const OWNER = "tbnd@prestigiousgamingonwheelsplus.com";
const FROM = `Prestigious Gaming on Wheels Plus <${OWNER}>`;
const PHONE = "(718) 673-8529";

// The business inbox plus every manager's email, without repeats.
const teamRecipients = (team = []) => [...new Set([OWNER, ...team.map((e) => e.toLowerCase())])];

function layout(title, bodyHtml) {
    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:0;background:#0b0b12;font-family:Arial,Helvetica,sans-serif;color:#f4f4f5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b12;">
            <tr>
                <td align="center" style="padding:24px 12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#15151f;border-radius:16px;">
                        <tr>
                            <td style="padding:28px 28px 8px;">
                                <p style="margin:0;color:#f5c542;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Prestigious Gaming on Wheels Plus</p>
                                <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;color:#ffffff;">${escapeHtml(title)}</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:8px 28px 28px;font-size:15px;line-height:1.6;color:#e4e4e7;">${bodyHtml}</td>
                        </tr>
                    </table>
                    <p style="margin:16px 0 0;font-size:12px;color:#71717a;">Queens, NY · ${PHONE} · prestigiousgamingonwheelsplus.com</p>
                </td>
            </tr>
        </table>
    </body>
</html>`;
}

function row(label, value) {
    return `<tr>
        <td style="padding:8px 12px 8px 0;color:#a1a1aa;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;color:#ffffff;">${value}</td>
    </tr>`;
}

function detailsTable(b, { forOwner }) {
    const addOns = (b.add_ons ?? [])
        .map((a) => `${escapeHtml(a.name)}${a.qty > 1 ? ` × ${a.qty}` : ""} (${dollars(Math.round(a.total * 100))})`)
        .join("<br />");
    const due = b.total_cents - b.paid_cents;
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #27272a;margin:16px 0;">
        ${row("Party", escapeHtml(b.package_name))}
        ${row("When", escapeHtml(describeWhen(b)))}
        ${row("Where", escapeHtml(b.address))}
        ${addOns ? row("Add-ons", addOns) : ""}
        ${forOwner ? row("Customer", escapeHtml(b.customer_name)) : ""}
        ${forOwner ? row("Phone", escapeHtml(b.customer_phone)) : ""}
        ${forOwner ? row("Email", escapeHtml(b.customer_email)) : ""}
        ${b.notes ? row("Notes", escapeHtml(b.notes).replace(/\r?\n/g, "<br />")) : ""}
        ${row("Total", dollars(b.total_cents))}
        ${row("Deposit paid", dollars(b.paid_cents))}
        ${row("Due on the day", `<strong>${dollars(due)}</strong>`)}
    </table>`;
}

export async function sendBookingConfirmation(env, booking, team = []) {
    const resend = new Resend(env.RESEND_KEY);
    const firstName = booking.customer_name.split(" ")[0];

    const customerHtml = layout(
        "You're booked!",
        `<p style="margin:0 0 12px;">Hi ${escapeHtml(firstName)}, thanks for booking with us. Your deposit is in and your date is locked.</p>
        ${detailsTable(booking, { forOwner: false })}
        <p style="margin:0 0 12px;">The remaining balance is due when we arrive. Add-ons, extra children and any travel or holiday surcharges are settled on the day.</p>
        <p style="margin:0 0 12px;">Please have at least 5 car lengths of parking ready for the trailer.</p>
        <p style="margin:0 0 12px;"><strong>Cancellation policy:</strong> we have a 48-hour cancellation policy. If you cancel with less than 48 hours' notice or miss your party, the deposit is non-refundable.</p>
        <p style="margin:0;">Need to change something? Call or text ${PHONE}, or just reply to this email.</p>`
    );
    const ownerHtml = layout(
        `New booking: ${booking.package_name}`,
        `<p style="margin:0 0 12px;">A new party was booked online and the deposit was paid.</p>${detailsTable(booking, { forOwner: true })}`
    );

    const results = await Promise.all([
        resend.emails.send({
            from: FROM,
            to: booking.customer_email,
            replyTo: OWNER,
            subject: `Your ${booking.package_name} is booked`,
            html: customerHtml,
        }),
        resend.emails.send({
            from: FROM,
            to: teamRecipients(team),
            replyTo: booking.customer_email,
            subject: `New booking: ${booking.package_name}, ${describeWhen(booking)}`,
            html: ownerHtml,
        }),
    ]);
    for (const { error } of results) if (error) console.error("Booking email failed:", error);
    // Nothing went out: throw so the caller retries. If only one failed, retrying would duplicate the other.
    if (results.every((r) => r.error)) throw new Error("Both booking emails failed");
}

// The day before the party. Throws when it doesn't go out, so the caller can try again on the next run.
export async function sendReminder(env, booking) {
    if (env.NODE_ENV === "development") {
        console.log(`Reminder for ${booking.customer_email}: ${booking.package_name}, ${describeWhen(booking)}`);
        return;
    }
    const firstName = booking.customer_name.split(" ")[0];
    const due = booking.total_cents - booking.paid_cents;
    const { error } = await new Resend(env.RESEND_KEY).emails.send({
        from: FROM,
        to: booking.customer_email,
        replyTo: OWNER,
        subject: `Reminder: your ${booking.package_name} is tomorrow`,
        html: layout(
            "See you tomorrow!",
            `<p style="margin:0 0 12px;">Hi ${escapeHtml(firstName)}, this is a reminder that your party is tomorrow. Here are the details we have:</p>
            ${detailsTable(booking, { forOwner: false })}
            <p style="margin:0 0 12px;">Please have at least 5 car lengths of parking ready for the trailer.</p>
            ${due > 0 ? `<p style="margin:0 0 12px;">The amount due on the day is paid when we arrive. Extra children or add-ons not listed above are settled then too.</p>` : ""}
            <p style="margin:0;">Running late, need to change something or have a question? Call or text ${PHONE}, or just reply to this email.</p>`
        ),
    });
    if (error) throw new Error(`Resend: ${error.message ?? JSON.stringify(error)}`);
}

// A manager's one-time sign-in link for /admin. Failures are only logged: the sign-in form says the same thing either
// way, so it can't reveal who's on the team.
export async function sendLoginLink(env, { to, name, url, minutes }) {
    if (env.NODE_ENV === "development") {
        console.log(`Sign-in link for ${to}: ${url}`);
        return;
    }
    try {
        const { error } = await new Resend(env.RESEND_KEY).emails.send({
            from: FROM,
            to,
            subject: "Your sign-in link for the bookings dashboard",
            html: layout(
                "Sign in to bookings",
                `<p style="margin:0 0 16px;">Hi ${escapeHtml(name.split(" ")[0])}, tap the button to sign in to the bookings dashboard. The link works once, for the next ${minutes} minutes.</p>
                <p style="margin:0 0 16px;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#f5c542;color:#0b0b12;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px;">Sign in</a></p>
                <p style="margin:0;color:#a1a1aa;font-size:13px;">Didn't ask for this? You can ignore this email.</p>`
            ),
        });
        if (error) console.error("Sign-in link email failed:", error);
    } catch (error) {
        console.error("Sign-in link email failed:", error);
    }
}

export async function sendOwnerAlert(env, team, subject, message) {
    try {
        const { error } = await new Resend(env.RESEND_KEY).emails.send({
            from: FROM,
            to: teamRecipients(team),
            subject,
            html: layout(subject, `<p style="margin:0;">${escapeHtml(message)}</p>`),
        });
        if (error) console.error("Owner alert failed:", error);
    } catch (error) {
        console.error("Owner alert failed:", error);
    }
}

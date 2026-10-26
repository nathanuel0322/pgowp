import { useSearchParams } from "react-router-dom";
import { MdContentCopy, MdEvent } from "react-icons/md";
import { toastSuccess } from "../GlobalFunctions";
import { calendarLinks, feedUrl } from "../lib/calendar";
import { SITE } from "../site";

// Where a team member's texted calendar link opens: one tap subscribes Apple Calendar, and the Google button adds the
// same feed to Google Calendar. The token is checked by the feed itself (/api/booking/calendar.ics), not here.
export default function CalendarSubscribe() {
    const [params] = useSearchParams();
    const token = params.get("token") ?? "";
    const valid = /^[0-9a-f]{40}$/.test(token);
    const links = calendarLinks(token);

    return (
        <section className="pb-12 pt-28 lg:pt-32">
            <div className="wrap max-w-lg">
                <div className="card grid gap-5 p-8">
                    <MdEvent className="text-4xl text-gold" aria-hidden />
                    <h1 className="h-display text-3xl">Add the bookings calendar</h1>
                    {valid ? (
                        <>
                            <p className="text-fog">
                                Every confirmed party shows up in your calendar on its own, with the address, the customer's
                                phone number and what's due on the day. Keep this link to yourself: anyone with it can see the
                                bookings.
                            </p>
                            <a href={links.apple} className="btn-gold justify-center">
                                iPhone, iPad or Mac: add to Apple Calendar
                            </a>
                            <a href={links.google} target="_blank" rel="noopener noreferrer" className="btn-ghost justify-center">
                                Add to Google Calendar
                            </a>
                            <p className="text-sm text-fog">
                                Google only lets you add a calendar link from a computer. Open this page on a computer, tap the
                                Google button and press Add. It then shows up in the Google Calendar app on your phone too. Google
                                can take several hours to pick up changes, so check the dashboard or call the office if a party
                                was booked or moved today.
                            </p>
                            <button
                                type="button"
                                className="flex items-center gap-2 text-sm font-semibold text-fog hover:text-white"
                                onClick={() => navigator.clipboard.writeText(feedUrl(token)).then(() => toastSuccess("Copied."))}
                            >
                                <MdContentCopy aria-hidden /> Copy the calendar link for another app
                            </button>
                        </>
                    ) : (
                        <p className="text-fog">
                            This link isn't complete. Ask the office to text you your calendar link again, or call{" "}
                            <a href={SITE.phoneHref} className="text-gold">
                                {SITE.phone}
                            </a>
                            .
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

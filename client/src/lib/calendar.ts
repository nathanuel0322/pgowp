import { SITE } from "../site";

// Team calendar links. The feed is served by the worker (/api/booking/calendar.ics); /calendar is the page a texted
// link opens, with buttons for Apple and Google Calendar.
export function feedUrl(token: string) {
    return `${SITE.url}/api/booking/calendar.ics?token=${token}`;
}

export function subscribePageUrl(token: string) {
    return `${SITE.url}/calendar?token=${token}`;
}

export function calendarLinks(token: string) {
    const webcal = feedUrl(token).replace(/^https:/, "webcal:");
    return {
        apple: webcal,
        google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
    };
}

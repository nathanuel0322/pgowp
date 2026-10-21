import { useEffect, useRef, useState } from "react";
import { MdDownload, MdIosShare } from "react-icons/md";
import InviteTemplate from "../assets/images/Invites.jpeg";
import { toastError, toastSuccess } from "../GlobalFunctions.ts";
import { CtaBand, PageHero } from "../components/ui";
import {
    InviteFields,
    MAX_LENGTHS,
    TEMPLATE_SIZE,
    cleanText,
    drawInviteText,
    ensureInviteFont,
    inviteFileName,
    renderInvite,
} from "../lib/invite";

const field =
    "w-full rounded-xl border border-line bg-ink/60 px-4 py-3.5 text-[15px] text-white placeholder:text-fog/60 transition focus:border-gold/60 focus:outline-hidden focus:ring-2 focus:ring-gold/20";

const EMPTY: InviteFields = { childname: "", location: "", partytime: "", phonenumber: "" };
const PREVIEW_SCALE = 2;
const REQUIRED: (keyof InviteFields)[] = ["childname", "location", "partytime"];
const REQUIRED_LABELS: Record<string, string> = {
    childname: "birthday child's name",
    location: "party location",
    partytime: "date & time",
};

function saveBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoking right away can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Reads straight from the inputs, so text typed before the page finished loading still counts.
function readForm(form: HTMLFormElement): InviteFields {
    const data = new FormData(form);
    const get = (key: keyof InviteFields) => String(data.get(key) ?? "");
    return {
        childname: get("childname"),
        location: get("location"),
        partytime: get("partytime"),
        phonenumber: get("phonenumber"),
    };
}

function canShareFiles() {
    try {
        const probe = new File([new Blob(["x"], { type: "image/jpeg" })], "probe.jpg", { type: "image/jpeg" });
        return typeof navigator.share === "function" && !!navigator.canShare?.({ files: [probe] });
    } catch {
        return false;
    }
}

export default function BDayCard() {
    const [fields, setFields] = useState<InviteFields>(EMPTY);
    const [busy, setBusy] = useState(false);
    const [shareable, setShareable] = useState(false);
    const [fontReady, setFontReady] = useState(false);
    // Buttons stay disabled until React is running. Otherwise an early tap does a plain GET submit
    // that puts the family's name, address and phone number in the URL.
    const [hydrated, setHydrated] = useState(false);
    const overlay = useRef<HTMLCanvasElement>(null);
    const form = useRef<HTMLFormElement>(null);
    const prerendered = useRef<{ key: string; blob: Blob } | null>(null);

    useEffect(() => {
        setHydrated(true);
        setShareable(canShareFiles());
        if (form.current) {
            const typed = readForm(form.current);
            if (Object.values(typed).some(Boolean)) setFields(typed);
        }
        ensureInviteFont().then(() => setFontReady(true));
    }, []);

    // Live preview: draw just the text on a transparent canvas laid over the template image.
    useEffect(() => {
        const canvas = overlay.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(PREVIEW_SCALE, PREVIEW_SCALE);
        drawInviteText(ctx, fields);
    }, [fields, fontReady]);

    // Pre-render the full image shortly after typing stops. iPhone Safari only opens the share sheet
    // if share() is called right after the tap, so the image needs to be ready before the click.
    useEffect(() => {
        if (REQUIRED.some((key) => !cleanText(fields[key]))) return;
        const key = JSON.stringify(fields);
        let cancelled = false;
        const timer = setTimeout(() => {
            renderInvite(InviteTemplate, fields)
                .then((blob) => {
                    if (!cancelled) prerendered.current = { key, blob };
                })
                .catch(() => undefined);
        }, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [fields]);

    const update = (key: keyof InviteFields) => (event: React.ChangeEvent<HTMLInputElement>) =>
        setFields((prev) => ({ ...prev, [key]: event.target.value }));

    const create = async (mode: "download" | "share", values: InviteFields) => {
        setBusy(true);
        try {
            const ready = prerendered.current;
            const blob =
                ready && ready.key === JSON.stringify(values) ? ready.blob : await renderInvite(InviteTemplate, values);
            const fileName = inviteFileName(values.childname);
            if (mode === "share") {
                try {
                    await navigator.share({
                        files: [new File([blob], fileName, { type: "image/jpeg" })],
                        title: "You're invited!",
                    });
                    return;
                } catch (error) {
                    // Closing the share sheet isn't an error. Anything else falls back to a download.
                    if (error instanceof DOMException && error.name === "AbortError") return;
                }
            }
            saveBlob(blob, fileName);
            toastSuccess("Invite saved! 🎉");
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const values = readForm(event.currentTarget);
        setFields(values);
        // "required" accepts a field of only spaces, which would print a blank line on the invite.
        const blank = REQUIRED.find((key) => !cleanText(values[key]));
        if (blank) {
            event.currentTarget.querySelector<HTMLInputElement>(`[name=${blank}]`)?.focus();
            toastError(`Please fill in the ${REQUIRED_LABELS[blank]}.`);
            return;
        }
        create(submitter?.value === "share" ? "share" : "download", values);
    };

    return (
        <>
            <PageHero
                eyebrow="Free e-invites"
                title={
                    <>
                        Make your <span className="text-gradient">gaming party invite</span>
                    </>
                }
                lede="Type the details, watch your invite fill in, then download it. Text it, post it or print it. It's free."
            />

            <section className="wrap">
                <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
                    <div className="lg:sticky lg:top-28">
                        <div className="relative overflow-hidden rounded-3xl border border-line shadow-[0_40px_120px_-40px_rgba(255,176,46,0.35)]">
                            <img
                                src={InviteTemplate}
                                alt="Gaming birthday invitation preview"
                                width={TEMPLATE_SIZE.width}
                                height={TEMPLATE_SIZE.height}
                                className="block h-auto w-full"
                            />
                            <canvas
                                ref={overlay}
                                width={TEMPLATE_SIZE.width * PREVIEW_SCALE}
                                height={TEMPLATE_SIZE.height * PREVIEW_SCALE}
                                aria-hidden
                                className="pointer-events-none absolute inset-0 h-full w-full"
                            />
                        </div>
                        <p className="mt-3 text-center text-xs text-fog">
                            Live preview. Your invite updates as you type.
                        </p>
                    </div>
                    <form ref={form} onSubmit={handleSubmit} className="card grid gap-5 p-6 sm:p-8">
                        <h2 className="h-display text-2xl">Invite details</h2>
                        <label className="grid gap-2 text-sm font-semibold text-white/85">
                            Birthday child's name
                            <input
                                name="childname"
                                required
                                maxLength={MAX_LENGTHS.childname}
                                autoComplete="off"
                                value={fields.childname}
                                onChange={update("childname")}
                                className={field}
                                placeholder="e.g. Jayden's 10th Birthday"
                            />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-white/85">
                            Party location
                            <input
                                name="location"
                                required
                                maxLength={MAX_LENGTHS.location}
                                autoComplete="street-address"
                                value={fields.location}
                                onChange={update("location")}
                                className={field}
                                placeholder="Address or venue"
                            />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-white/85">
                            Date & time
                            <input
                                name="partytime"
                                required
                                maxLength={MAX_LENGTHS.partytime}
                                autoComplete="off"
                                value={fields.partytime}
                                onChange={update("partytime")}
                                className={field}
                                placeholder="Sat, June 14 · 2-5 PM"
                            />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-white/85">
                            RSVP phone number
                            <input
                                name="phonenumber"
                                type="tel"
                                maxLength={MAX_LENGTHS.phonenumber}
                                autoComplete="tel"
                                value={fields.phonenumber}
                                onChange={update("phonenumber")}
                                className={field}
                                placeholder="(718) 555-0123"
                            />
                        </label>
                        <div
                            className={`mt-2 grid gap-3 ${shareable ? "sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" : ""}`}
                        >
                            <button
                                type="submit"
                                value="download"
                                className="btn-gold whitespace-nowrap py-4!"
                                disabled={busy || !hydrated}
                            >
                                <MdDownload size={20} aria-hidden /> {busy ? "Creating..." : "Download invite"}
                            </button>
                            {shareable && (
                                <button
                                    type="submit"
                                    value="share"
                                    className="btn-ghost whitespace-nowrap py-4!"
                                    disabled={busy || !hydrated}
                                >
                                    <MdIosShare size={20} aria-hidden /> Share invite
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-fog">
                            Saves as a high-resolution image. Nothing you type leaves your device.
                        </p>
                    </form>
                </div>
            </section>

            <CtaBand title="Invites ready? Let's book the trailer." />
        </>
    );
}

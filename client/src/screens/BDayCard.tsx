import { useState } from "react";
import { MdDownload } from "react-icons/md";
import InvitePreview from "../assets/images/Invites.jpeg";
import { toastPromise } from "../GlobalFunctions.ts";
import { CtaBand, PageHero } from "../components/ui";

const field =
    "w-full rounded-xl border border-line bg-ink/60 px-4 py-3.5 text-[15px] text-white placeholder:text-fog/60 transition focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20";

function downloadBase64Png(base64: string) {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "BirthdayCard.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default function BDayCard() {
    const [busy, setBusy] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const payload = {
            childname: String(data.get("childname") ?? ""),
            location: String(data.get("location") ?? ""),
            partytime: String(data.get("partytime") ?? ""),
            phonenumber: String(data.get("phonenumber") ?? ""),
        };
        setBusy(true);
        toastPromise(
            fetch("https://natesscraper-latest.onrender.com/bdaycard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
                .then((response) => response.json())
                .then(downloadBase64Png)
                .finally(() => setBusy(false)),
            "Please allow up to 2 minutes for the image to download!",
            "E-Invite Saved! 🎉"
        );
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
                lede="Fill in the details and download a ready-to-share birthday invitation. Text it, post it or print it. It's free."
            />

            <section className="wrap">
                <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
                    <div className="overflow-hidden rounded-3xl border border-line shadow-[0_40px_120px_-40px_rgba(255,176,46,0.35)]">
                        <img
                            src={InvitePreview}
                            alt="Prestigious Gaming on Wheels Plus superhero birthday invitation template"
                            width={1024}
                            height={696}
                            className="block h-auto w-full"
                        />
                    </div>
                    <form onSubmit={handleSubmit} className="card grid gap-5 p-6 sm:p-8">
                        <h2 className="h-display text-2xl">Invite details</h2>
                        <label className="grid gap-2 text-sm font-semibold text-white/85">
                            Birthday child's name
                            <input name="childname" required className={field} placeholder="e.g. Jayden" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-white/85">
                            Party location
                            <input name="location" required className={field} placeholder="Address or venue" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-white/85">
                            Date & time
                            <input name="partytime" required className={field} placeholder="Sat, June 14 · 2-5 PM" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-white/85">
                            RSVP phone number
                            <input name="phonenumber" type="tel" className={field} placeholder="(718) 555-0123" />
                        </label>
                        <button type="submit" className="btn-gold mt-2 !py-4" disabled={busy}>
                            <MdDownload size={20} aria-hidden /> {busy ? "Creating your invite..." : "Download invite"}
                        </button>
                        <p className="text-xs text-fog">Generating the image can take up to 2 minutes.</p>
                    </form>
                </div>
            </section>

            <CtaBand title="Invites ready? Let's book the trailer." />
        </>
    );
}

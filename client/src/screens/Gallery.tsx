import { useCallback, useEffect, useState } from "react";
import { MdClose, MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import { FaInstagram } from "react-icons/fa6";
import { CtaBand, Img, PageHero } from "../components/ui";
import { GALLERY } from "../data/photos";
import { SITE } from "../site";

export default function Gallery() {
    const [open, setOpen] = useState<number | null>(null);

    const step = useCallback(
        (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + GALLERY.length) % GALLERY.length)),
        []
    );

    useEffect(() => {
        if (open === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(null);
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
        };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };
    }, [open, step]);

    const current = open === null ? null : GALLERY[open];

    return (
        <>
            <PageHero
                eyebrow="Gallery"
                title={
                    <>
                        Party photos from <span className="text-gradient">real events</span>
                    </>
                }
                lede="Birthday parties, school fun days and laser tag battles across Queens, Brooklyn and Long Island. Tap any photo to see it full size."
            />

            <section className="wrap">
                <ul className="columns-2 gap-3 md:columns-3 [&>li]:mb-3">
                    {GALLERY.map((p, i) => (
                        <li key={p.src} className="break-inside-avoid">
                            <button
                                type="button"
                                onClick={() => setOpen(i)}
                                className="group block w-full overflow-hidden rounded-2xl border border-line"
                                aria-label={`Open photo: ${p.alt}`}
                            >
                                <Img
                                    photo={p}
                                    sizes="(min-width: 768px) 33vw, 50vw"
                                    className="!h-auto transition duration-700 group-hover:scale-105"
                                />
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="mt-10 text-center">
                    <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                        <FaInstagram size={18} aria-hidden /> More on Instagram
                    </a>
                </div>
            </section>

            {current && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={current.alt}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4 backdrop-blur"
                    onClick={() => setOpen(null)}
                >
                    <img
                        src={current.src}
                        alt={current.alt}
                        className="max-h-[85vh] max-w-full rounded-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        type="button"
                        aria-label="Close"
                        className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                        onClick={() => setOpen(null)}
                    >
                        <MdClose size={26} />
                    </button>
                    <button
                        type="button"
                        aria-label="Previous photo"
                        className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            step(-1);
                        }}
                    >
                        <MdNavigateBefore size={28} />
                    </button>
                    <button
                        type="button"
                        aria-label="Next photo"
                        className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            step(1);
                        }}
                    >
                        <MdNavigateNext size={28} />
                    </button>
                </div>
            )}

            <CtaBand title="Want your party in here next?" />
        </>
    );
}

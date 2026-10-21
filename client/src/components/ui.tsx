import { ReactNode } from "react";
import { MdPhone } from "react-icons/md";
import { Photo } from "../data/photos";
import { SITE } from "../site";
import { BookButton } from "./global/Header";

export function SectionHeading({
    eyebrow,
    title,
    lede,
    align = "left",
    as: Tag = "h2",
}: {
    eyebrow?: string;
    title: ReactNode;
    lede?: ReactNode;
    align?: "left" | "center";
    as?: "h1" | "h2";
}) {
    const center = align === "center";
    return (
        <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <Tag
                className={`h-display mt-4 ${
                    Tag === "h1" ? "text-[2.1rem] sm:text-5xl lg:text-6xl" : "text-[1.75rem] sm:text-4xl lg:text-[2.75rem]"
                }`}
            >
                {title}
            </Tag>
            {lede && <p className={`lede mt-5 ${center ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{lede}</p>}
        </div>
    );
}

export function Img({
    photo,
    className = "",
    sizes = "(min-width: 1024px) 50vw, 100vw",
    priority = false,
}: {
    photo: Photo;
    className?: string;
    sizes?: string;
    priority?: boolean;
}) {
    return (
        <img
            src={photo.src}
            srcSet={photo.srcSet}
            sizes={sizes}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            {...(priority ? { fetchpriority: "high" } : {})}
            className={`block h-full w-full object-cover ${className}`}
        />
    );
}

export function PageHero({ eyebrow, title, lede }: { eyebrow: string; title: ReactNode; lede: ReactNode }) {
    return (
        <section className="relative overflow-hidden pb-12 pt-32 sm:pb-16 lg:pt-40">
            <div aria-hidden className="grid-bg absolute inset-0 opacity-60" />
            <div aria-hidden className="glow-gold absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2" />
            <div className="wrap relative animate-rise">
                <SectionHeading eyebrow={eyebrow} title={title} lede={lede} as="h1" />
            </div>
        </section>
    );
}

export function CtaBand({
    title = "Ready to level up your next party?",
    text = "Dates book up fast, especially weekends. Lock yours in with a deposit and we handle the rest.",
}: {
    title?: string;
    text?: string;
}) {
    return (
        <section className="wrap mt-24">
            <div className="relative overflow-hidden rounded-4xl border border-gold/20 bg-linear-to-br from-[#1b1408] via-surface to-[#0b0e22] px-6 py-14 text-center sm:px-12 sm:py-16">
                <div aria-hidden className="glow-gold absolute -left-24 -top-24 h-80 w-80" />
                <div aria-hidden className="glow-volt absolute -bottom-32 -right-24 h-96 w-96" />
                <div className="relative">
                    <h2 className="h-display mx-auto max-w-2xl text-3xl sm:text-4xl">{title}</h2>
                    <p className="lede mx-auto mt-4 max-w-xl">{text}</p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <BookButton className="btn-gold px-8! py-4!" label="Check availability" />
                        <a href={SITE.phoneHref} className="btn-ghost px-8! py-4!">
                            <MdPhone size={18} aria-hidden /> {SITE.phone}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

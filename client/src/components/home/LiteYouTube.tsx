import { useState } from "react";
import { FaPlay } from "react-icons/fa6";

// Loads the heavy YouTube player only after a click, keeping the page fast.
export default function LiteYouTube({ id, title }: { id: string; title: string }) {
    const [playing, setPlaying] = useState(false);

    return (
        <div className="relative aspect-video overflow-hidden rounded-3xl border border-line bg-raised">
            {playing ? (
                <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                    title={title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    className="group absolute inset-0 h-full w-full"
                    aria-label={`Play video: ${title}`}
                >
                    <img
                        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                    <span className="absolute inset-0 bg-linear-to-t from-ink/80 via-transparent to-transparent" />
                    <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold text-ink shadow-[0_0_60px_-5px_rgba(255,176,46,0.8)] transition group-hover:scale-110">
                        <FaPlay size={26} className="ml-1" />
                    </span>
                    <span className="absolute bottom-5 left-5 text-left text-sm font-semibold text-white">
                        {title}
                    </span>
                </button>
            )}
        </div>
    );
}

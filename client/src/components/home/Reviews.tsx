import { useRef } from "react";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import { FaQuoteLeft, FaYelp, FaGoogle, FaStar } from "react-icons/fa6";
import { SectionHeading } from "../ui";
import { WIDGIE_URL, useReviews } from "../../lib/reviews";

function Stars({ count, size = 14 }: { count: number; size?: number }) {
    return (
        <span className="flex gap-0.5 text-gold" aria-label={`${count} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
                <FaStar key={i} size={size} className={i < count ? "" : "opacity-25"} aria-hidden />
            ))}
        </span>
    );
}

// Google and Yelp reviews through Widgie. Renders nothing until there are reviews to show.
export default function Reviews({ className = "mt-28" }: { className?: string }) {
    const data = useReviews();
    const track = useRef<HTMLDivElement>(null);

    if (!data?.reviews.length) return null;

    const scroll = (dir: 1 | -1) => {
        const el = track.current;
        if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 420), behavior: "smooth" });
    };

    const ratings = [
        { label: "Google", rating: data.googleRating, url: data.googleUrl, icon: <FaGoogle size={16} aria-hidden /> },
        { label: "Yelp", rating: data.yelpRating, url: data.yelpUrl, icon: <FaYelp size={18} aria-hidden /> },
    ].filter((r) => r.rating && r.url);

    return (
        <section className={className} aria-labelledby="reviews-title">
            <div className="wrap flex flex-wrap items-end justify-between gap-6">
                <div>
                    <SectionHeading eyebrow="Reviews" title={<span id="reviews-title">Parents say it best</span>} />
                    {ratings.length > 0 && (
                        <ul className="mt-5 flex flex-wrap gap-3">
                            {ratings.map((r) => (
                                <li key={r.label}>
                                    <a
                                        href={r.url!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 rounded-full border border-line px-4 py-2 text-sm text-white transition hover:border-gold"
                                    >
                                        {r.icon}
                                        <span className="font-bold">{r.rating!.toFixed(1)}</span>
                                        <Stars count={Math.round(r.rating!)} />
                                        <span className="text-fog">on {r.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => scroll(-1)}
                        className="grid h-12 w-12 place-items-center rounded-full border border-line text-white transition hover:border-gold hover:text-gold"
                        aria-label="Previous reviews"
                    >
                        <MdNavigateBefore size={26} />
                    </button>
                    <button
                        type="button"
                        onClick={() => scroll(1)}
                        className="grid h-12 w-12 place-items-center rounded-full border border-line text-white transition hover:border-gold hover:text-gold"
                        aria-label="Next reviews"
                    >
                        <MdNavigateNext size={26} />
                    </button>
                </div>
            </div>
            <div
                ref={track}
                className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none] sm:px-6 lg:px-[max(2rem,calc((100vw-76rem)/2+2rem))] [&::-webkit-scrollbar]:hidden"
            >
                {data.reviews.map((review, i) => (
                    <figure key={i} className="card flex w-[85%] shrink-0 snap-start flex-col justify-between p-7 sm:w-[380px]">
                        <div>
                            <div className="flex items-center justify-between">
                                <FaQuoteLeft className="text-gold" size={22} aria-hidden />
                                <Stars count={review.stars} />
                            </div>
                            <blockquote className="mt-5 line-clamp-[8] text-[15px] leading-relaxed text-white/90">{review.text}</blockquote>
                        </div>
                        <figcaption className="mt-7 flex items-center gap-3 border-t border-line pt-5">
                            {review.photo && (
                                <img
                                    src={review.photo}
                                    referrerPolicy="no-referrer"
                                    alt=""
                                    loading="lazy"
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            )}
                            <span className="text-sm font-bold text-white">{review.name}</span>
                            <span className="ml-auto text-fog" title={review.source === "yelp" ? "Yelp review" : "Google review"}>
                                {review.source === "yelp" ? <FaYelp size={18} aria-label="Yelp" /> : <FaGoogle size={16} aria-label="Google" />}
                            </span>
                        </figcaption>
                    </figure>
                ))}
            </div>
            <div className="wrap mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-fog">
                <p>
                    Had a party with us?{" "}
                    {data.googleUrl && (
                        <a href={data.googleUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold hover:underline">
                            Review us on Google
                        </a>
                    )}
                    {data.googleUrl && data.yelpReviewUrl && " or "}
                    {data.yelpReviewUrl && (
                        <a href={data.yelpReviewUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold hover:underline">
                            on Yelp
                        </a>
                    )}
                    .
                </p>
                <p>
                    Reviews shown with{" "}
                    <a href={WIDGIE_URL} target="_blank" rel="noopener" className="font-semibold text-white/80 hover:text-gold">
                        widgie
                    </a>
                    , the free review widget for small business websites.
                </p>
            </div>
        </section>
    );
}

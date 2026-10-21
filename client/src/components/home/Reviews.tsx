import { useEffect, useRef, useState } from "react";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import { FaQuoteLeft, FaYelp, FaGoogle } from "react-icons/fa6";
import { SectionHeading } from "../ui";

interface Review {
    name: string;
    photo?: string;
    reviewtext: string;
    yelp?: boolean;
}

// Reviews come from the Widgie widget (Google + Yelp). Loaded after mount so the page renders instantly.
export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const track = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { supabase_widgie } = await import("../../supabase_widgie");
                const { data, error } = await supabase_widgie
                    .from("widgets")
                    .select("yelpreviews, googlereviews")
                    .eq("id", "88bfbcb1-5060-4dca-914c-33788e9850c2")
                    .single();
                if (error) throw error;
                const all: Review[] = [
                    ...(data.yelpreviews ?? []).map((r: Review) => ({ ...r, yelp: true })),
                    ...(data.googlereviews ?? []).map((r: Review) => ({ ...r, yelp: false })),
                ].filter((r) => r.reviewtext);
                if (!cancelled) setReviews(all);
            } catch (err) {
                console.error("Error fetching reviews:", err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (reviews.length === 0) return null;

    const scroll = (dir: 1 | -1) => {
        const el = track.current;
        if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 420), behavior: "smooth" });
    };

    return (
        <section className="mt-28" aria-labelledby="reviews-title">
            <div className="wrap flex flex-wrap items-end justify-between gap-6">
                <SectionHeading eyebrow="Reviews" title={<span id="reviews-title">Parents say it best</span>} />
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
                {reviews.map((review, i) => (
                    <figure
                        key={i}
                        className="card flex w-[85%] shrink-0 snap-start flex-col justify-between p-7 sm:w-[380px]"
                    >
                        <div>
                            <FaQuoteLeft className="text-gold" size={22} aria-hidden />
                            <blockquote className="mt-5 line-clamp-[8] text-[15px] leading-relaxed text-white/90">
                                {review.reviewtext}
                            </blockquote>
                        </div>
                        <figcaption className="mt-7 flex items-center gap-3 border-t border-line pt-5">
                            {review.photo && (
                                <img
                                    src={review.photo}
                                    referrerPolicy="no-referrer"
                                    alt=""
                                    loading="lazy"
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            )}
                            <span className="text-sm font-bold text-white">{review.name}</span>
                            <span className="ml-auto text-fog" title={review.yelp ? "Yelp review" : "Google review"}>
                                {review.yelp ? <FaYelp size={18} /> : <FaGoogle size={16} />}
                            </span>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
}

import { AiOutlinePlus } from "react-icons/ai";
import GamingContract from "../assets/files/GamingContract.pdf";
import { Faq } from "../data/faq";

// Native <details> keeps every answer in the HTML for search engines and works without JavaScript.
export default function FaqList({ faqs }: { faqs: Faq[] }) {
    return (
        <div className="divide-y divide-line border-y border-line">
            {faqs.map((faq) => (
                <details key={faq.question} className="group py-1 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left">
                        <h3 className="text-base font-bold text-white sm:text-lg">{faq.question}</h3>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-gold transition duration-300 group-open:rotate-45 group-open:border-gold/50">
                            <AiOutlinePlus size={18} aria-hidden />
                        </span>
                    </summary>
                    <div className="pb-6 pr-12 text-[15px] leading-relaxed text-fog">
                        <p>{faq.answer}</p>
                        {faq.link && (
                            <a
                                href={faq.link.href === "contract" ? GamingContract : faq.link.href}
                                {...(faq.link.download ? { download: "PGOWP-Party-Agreement.pdf" } : {})}
                                {...(faq.link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className="mt-3 inline-block font-semibold text-gold underline-offset-4 hover:underline"
                            >
                                {faq.link.label} →
                            </a>
                        )}
                    </div>
                </details>
            ))}
        </div>
    );
}

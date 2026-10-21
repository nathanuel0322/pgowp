import { MdPhone } from "react-icons/md";
import { Link } from "react-router-dom";
import FaqList from "../components/FaqList";
import { CtaBand, Img, PageHero } from "../components/ui";
import { FAQS } from "../data/faq";
import { photo } from "../data/photos";
import { SITE } from "../site";

export default function About() {
    return (
        <>
            <PageHero
                eyebrow="About us"
                title={
                    <>
                        A family business, <span className="text-gradient">built for play</span>
                    </>
                }
                lede="We're a tech-savvy, family-owned company from Queens, NY. We started Prestigious Gaming on Wheels Plus because our own gaming-obsessed sons deserved a party as epic as the games they love."
            />

            <section className="wrap">
                <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
                    <aside className="lg:sticky lg:top-28 lg:self-start">
                        <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-line">
                            <Img photo={photo("birthday-group")} sizes="(min-width: 1024px) 35vw, 100vw" />
                        </div>
                        <div className="card mt-5 p-6">
                            <h2 className="font-display text-lg font-semibold text-white">Still have questions?</h2>
                            <p className="mt-2 text-sm text-fog">We're happy to help you plan the perfect party.</p>
                            <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                                <a href={SITE.phoneHref} className="btn-gold">
                                    <MdPhone size={18} aria-hidden /> {SITE.phone}
                                </a>
                                <Link to="/contact-us" className="btn-ghost">
                                    Send a message
                                </Link>
                            </div>
                        </div>
                    </aside>
                    <div>
                        <h2 className="h-display text-2xl sm:text-3xl">Frequently asked questions</h2>
                        <div className="mt-8">
                            <FaqList faqs={FAQS} />
                        </div>
                    </div>
                </div>
            </section>

            <CtaBand />
        </>
    );
}

import { Suspense, lazy, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../../screens/Home";
import Services from "../../screens/Services";
import Packages from "../../screens/Packages";
import Gallery from "../../screens/Gallery";
import Contact from "../../screens/Contact";
import About from "../../screens/About";
import BDayCard from "../../screens/BDayCard";
import NotFound from "../../screens/NotFound";
import Header from "./Header";
import Footer from "./Footer";
import Seo from "./Seo";

// Pages that aren't prerendered are split out of the main bundle.
const Book = lazy(() => import("../../screens/Book"));
const BookConfirmed = lazy(() => import("../../screens/BookConfirmed"));
const Admin = lazy(() => import("../../screens/Admin"));
const EInvites = lazy(() => import("../../screens/EInvites"));

export default function Routing() {
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

    return (
        <>
            <Seo />
            <Header drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
            <main id="main" className="overflow-x-clip">
                <Suspense fallback={<div className="min-h-screen" />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/packages" element={<Packages />} />
                        <Route path="/gallery" element={<Gallery />} />
                        <Route path="/contact-us" element={<Contact />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/bday-card" element={<BDayCard />} />
                        <Route path="/e-invites" element={<EInvites />} />
                        <Route path="/book" element={<Book />} />
                        <Route path="/book/confirmed" element={<BookConfirmed />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </main>
            <Footer />
        </>
    );
}

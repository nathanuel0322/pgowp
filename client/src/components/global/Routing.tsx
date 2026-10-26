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
import AreaPage from "../../screens/AreaPage";
import { AREAS } from "../../data/areas";
import Header from "./Header";
import Footer from "./Footer";
import Seo from "./Seo";

// Booking, the owner dashboard and the print view aren't prerendered, so they load as separate chunks.
const BookParty = lazy(() => import("../../screens/BookParty"));
const BookingConfirmed = lazy(() => import("../../screens/BookingConfirmed"));
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
                        {AREAS.map((a) => (
                            <Route key={a.slug} path={a.path} element={<AreaPage area={a} />} />
                        ))}
                        <Route path="/book" element={<BookParty />} />
                        <Route path="/book/confirmed" element={<BookingConfirmed />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </main>
            <Footer />
        </>
    );
}

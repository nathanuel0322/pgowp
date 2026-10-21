import { Suspense, lazy, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
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

// The in-site booking flow is only reachable in development and pulls in heavy dependencies (MUI, calendar,
// Google Places), so it is split out of the main bundle.
const BookingLayout = lazy(() => import("../booking/BookingLayout"));
const CartDrawer = lazy(() => import("../booking/CartDrawer"));
const Book = lazy(() => import("../../screens/Book"));
const Checkout = lazy(() => import("../../screens/Checkout"));
const CheckoutDetails = lazy(() => import("../../screens/CheckoutDetails"));
const EInvites = lazy(() => import("../../screens/EInvites"));

const BOOKING_PATHS = ["/book", "/checkout", "/checkout-details"];

export default function Routing() {
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
    const location = useLocation();
    const inBooking = BOOKING_PATHS.includes(location.pathname);

    return (
        <>
            <Seo />
            <Header drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} setCartDrawerOpen={setCartDrawerOpen} />
            {inBooking && (
                <Suspense fallback={null}>
                    <CartDrawer cartDrawerOpen={cartDrawerOpen} setCartDrawerOpen={setCartDrawerOpen} />
                </Suspense>
            )}
            <main id="main" className={`overflow-x-clip ${location.pathname === "/checkout" ? "px-[2%]" : ""}`}>
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
                        <Route
                            path="/book"
                            element={
                                <BookingLayout>
                                    <Book cartDrawerOpen={cartDrawerOpen} />
                                </BookingLayout>
                            }
                        />
                        <Route
                            path="/checkout"
                            element={
                                <BookingLayout>
                                    <Checkout />
                                </BookingLayout>
                            }
                        />
                        <Route
                            path="/checkout-details"
                            element={
                                <BookingLayout>
                                    <CheckoutDetails />
                                </BookingLayout>
                            }
                        />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </main>
            <Footer />
        </>
    );
}

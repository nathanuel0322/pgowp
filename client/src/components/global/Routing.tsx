import { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "../../screens/Home";
import Services from "../../screens/Services";
import Packages from "../../screens/Packages";
import Contact from "../../screens/Contact";
import About from "../../screens/About";
import EInvites from "../../screens/EInvites";
import BDayCard from "../../screens/BDayCard";
import Book from "../../screens/Book";
import "../../assets/css/routing.css";
import CartDrawer from "../booking/CartDrawer";
import Checkout from "../../screens/Checkout";
import CheckoutDetails from "../../screens/CheckoutDetails";
import Header from "./Header";

export default function Routing() {
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
    const location = useLocation();

    return (
        <div id="routing-div" className={`${location.pathname === "/checkout" ? "px-[2%]" : ""}`}>
            <Header drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} setCartDrawerOpen={setCartDrawerOpen} />
            <CartDrawer cartDrawerOpen={cartDrawerOpen} setCartDrawerOpen={setCartDrawerOpen} />
            <Routes>
                <Route path="" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/packages" element={<Packages />} />
                <Route path="/contact-us" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/e-invites" element={<EInvites />} />
                <Route path="/bday-card" element={<BDayCard />} />
                <Route path="/book" element={<Book cartDrawerOpen={cartDrawerOpen} />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout-details" element={<CheckoutDetails />} />
            </Routes>
        </div>
    );
}

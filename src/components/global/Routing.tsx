import { useMediaQuery } from "react-responsive";
import HamburgerNav from "./HamburgerNav";
import { useState } from "react";
import SideDrawer from "./SideDrawer";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "../../screens/Home";
import Services from "../../screens/Services";
import Packages from "../../screens/Packages";
import Gamelist from "../../screens/Gamelist";
import Contact from "../../screens/Contact";
import About from "../../screens/About";
import EInvites from "../../screens/EInvites";
import BDayCard from "../../screens/BDayCard";
import Book from "../../screens/Book";
import "../../assets/css/routing.css";
import CartDrawer from "../booking/CartDrawer";
import Header from "./Header";
import Checkout from "../../screens/Checkout";

export default function Routing() {
    const hamburgerdetector = useMediaQuery({ query: "(max-width: 991px)" });
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
    const location = useLocation();

    return (
        <div id="routing-div" className={`${location.pathname === "/checkout" ? "px-[2%]" : "px-[5vw]"}`}>
            {hamburgerdetector ? (
                <HamburgerNav setDrawerOpen={setDrawerOpen} setCartDrawerOpen={setCartDrawerOpen} />
            ) : (
                <Header setCartDrawerOpen={setCartDrawerOpen} />
            )}
            <SideDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
            <CartDrawer cartDrawerOpen={cartDrawerOpen} setCartDrawerOpen={setCartDrawerOpen} />
            <Routes>
                <Route path="" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/packages" element={<Packages />} />
                <Route path="/game-list" element={<Gamelist />} />
                <Route path="/contact-us" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/e-invites" element={<EInvites />} />
                <Route path="/bday-card" element={<BDayCard />} />
                <Route path="/book" element={<Book cartDrawerOpen={cartDrawerOpen} />} />
                <Route path="/checkout" element={<Checkout />} />
            </Routes>
        </div>
    );
}

import React, { createContext, useState } from "react";
import "./assets/css/home.css";
import { Routes, Route } from "react-router-dom";
import { HashRouter as Router } from "react-router-dom";
import Navbar from "./components/global/Navbar";
import Home from "./screens/Home";
import Services from "./screens/Services.tsx";
import Gamelist from "./screens/Gamelist";
import Contact from "./screens/Contact";
import About from "./screens/About";
import BDayCard from "./screens/BDayCard.tsx";
import Packages from "./screens/Packages";
import HamburgerNav from "./components/global/HamburgerNav.tsx";
import { useMediaQuery } from "react-responsive";
import SideDrawer from "./components/global/SideDrawer";
import { Toaster } from "react-hot-toast";
import EInvites from "./screens/EInvites";

interface AppContextType {
    currentpage: string | null;
    setcurrentpage: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AppContext = createContext<AppContextType>({
    currentpage: null,
    setcurrentpage: () => {},
});

function App() {
    const hamburgerdetector = useMediaQuery({ query: "(max-width: 991px)" });
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [currentpage, setcurrentpage] = useState<string | null>(null);

    return (
        <AppContext.Provider
            value={{
                currentpage,
                setcurrentpage,
            }}
        >
            <Router>
                {hamburgerdetector ? <HamburgerNav drawerfunc={setDrawerOpen} /> : <Navbar />}
                <SideDrawer drawerstate={drawerOpen} drawerfunc={setDrawerOpen} />
                <Routes>
                    <Route path="" element={<Home />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/packages" element={<Packages />} />
                    <Route path="/gamelist" element={<Gamelist />} />
                    <Route path="/contactus" element={<Contact />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/e-invites" element={<EInvites />} />
                    <Route path="/bdaycard" element={<BDayCard />} />
                </Routes>
            </Router>
            <Toaster position="top-center" containerClassName="!flex !flex-row !items-center !justify-center" />
        </AppContext.Provider>
    );
}

export default App;

import React, { useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/css/hamburger.css";
import { IoReorderThreeOutline } from "react-icons/io5";
import { AppContext } from "../../App.tsx";
import PGOWPLogo from "../../assets/images/favicon-96x96.png";
import { MdShoppingCart } from "react-icons/md";

const HamburgerNav = ({
    setDrawerOpen,
    setCartDrawerOpen,
}: {
    setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCartDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const location = useLocation();
    const { currentpage, setcurrentpage } = useContext(AppContext);
    console.log("currentpage:", currentpage);

    useEffect(() => {
        console.log("location.pathname:", location.pathname);
        if (location.pathname === "/services") setcurrentpage("Services");
        else if (location.pathname === "/packages") setcurrentpage("Packages");
        else if (location.pathname === "/") setcurrentpage("Home");
        else if (location.pathname === "/game-list") setcurrentpage("Game List");
        else if (location.pathname === "/contact-us") setcurrentpage("Contact Us");
        else if (location.pathname === "/about") setcurrentpage("About");
        else if (location.pathname === "/bday-card") setcurrentpage("BDay Card");
        else if (location.pathname === "/e-invites") setcurrentpage("E-Invites");
        else if (location.pathname === "/book") setcurrentpage("Book");
        else if (location.pathname === "/checkout-details") setcurrentpage("Checkout Details");
    }, [location.pathname]);

    return (
        <nav id="mobilenav" style={{ position: currentpage === "BDay Card" ? "relative" : "fixed" }}>
            <div id="headerdiv">
                <div id="brand">
                    <div id="logo">
                        <Link to="/" id="logolink">
                            <img id="logoimg" src={PGOWPLogo} alt="PGOWP Logo" />
                        </Link>
                    </div>
                    <div id="captionwrap" className="flex text-white">
                        {currentpage}
                    </div>
                </div>
                {currentpage === "Book" && (
                    <button id="cartbtn" type="button" onClick={() => setCartDrawerOpen(true)} title="Cart">
                        <MdShoppingCart color="white" size={30} />
                    </button>
                )}
                <IoReorderThreeOutline
                    color="white"
                    size={50}
                    onClick={() => setDrawerOpen(true)}
                    className="cursor-pointer"
                />
            </div>
        </nav>
    );
};

export default HamburgerNav;

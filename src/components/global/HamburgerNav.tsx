import React, { useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/css/hamburger.css";
import "../../assets/css/Navbar.css";
import { IoReorderThreeOutline } from "react-icons/io5";
import { AppContext } from "../../App.tsx";

const HamburgerNav = ({ drawerfunc }) => {
    const location = useLocation();
    const { currentpage, setcurrentpage } = useContext(AppContext);
    console.log("currentpage:", currentpage);

    useEffect(() => {
        console.log("location.pathname:", location.pathname);
        if (location.pathname === "/services") {
            setcurrentpage("Services");
        } else if (location.pathname === "/packages") {
            setcurrentpage("Packages");
        } else if (location.pathname === "/") {
            setcurrentpage("Home");
        } else if (location.pathname === "/gamelist") {
            setcurrentpage("Game List");
        } else if (location.pathname === "/contactus") {
            setcurrentpage("Contact Us");
        } else if (location.pathname === "/about") {
            setcurrentpage("About");
        } else if (location.pathname === "/bdaycard") {
            setcurrentpage("BDay Card");
        } else if (location.pathname === "/e-invites") {
            setcurrentpage("E-Invites");
        }
    }, [location.pathname]);

    return (
        <nav id="mobilenav" style={{ position: currentpage === "BDay Card" ? "relative" : "fixed" }}>
            <div id="headerdiv">
                <div id="brand">
                    <div id="logo">
                        <Link to="/" id="logolink">
                            <img id="logoimg" src={require("../../assets/images/favicon-96x96.png")} alt="PGOWP Logo" />
                        </Link>
                    </div>
                    <div id="captionwrap" className="flex text-white">
                        {currentpage}
                    </div>
                </div>
                <IoReorderThreeOutline
                    color="white"
                    size={50}
                    onClick={() => {
                        drawerfunc(true);
                    }}
                />
            </div>
        </nav>
    );
};

export default HamburgerNav;

import React, { useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/css/hamburger.css";
import { IoReorderThreeOutline } from "react-icons/io5";
import { AuthContext } from "../../App.tsx";
import PGOWPLogo from "../../assets/images/favicon-96x96.png";

const HamburgerNav = ({ setDrawerOpen }: { setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>> }) => {
    const location = useLocation();
    const { currentpage, setcurrentpage } = useContext(AuthContext);
    console.log("currentpage:", currentpage);

    useEffect(() => {
        console.log("location.pathname:", location.pathname);
        if (location.pathname === "/") setcurrentpage("Home");
        else if (location.pathname === "/sign-in") setcurrentpage("Sign In");
        else if (location.pathname === "/reset-password") setcurrentpage("Reset Password");
        else if (location.pathname === "/verify-mfa") setcurrentpage("Verify MFA");
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

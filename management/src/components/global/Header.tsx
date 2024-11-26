import "../../assets/css/header.css";
import "../../assets/css/hamburger.css";
import { Link, useLocation } from "react-router-dom";
import PGOWPLogo from "../../assets/images/favicon-96x96.png";

export default function Header() {
    const location = useLocation();
    // console.log("location.pathname:", location.pathname)

    return (
        <div
            id="header"
            style={{
                position: location.pathname === "/bday-card" ? "relative" : "fixed",
                display: location.pathname === "/e-invites" ? "none" : "flex",
            }}
        >
            <div className="navbar">
                <div id="brand">
                    <div id="logo">
                        <Link to="/" id="logolink">
                            <img id="logoimg" src={PGOWPLogo} alt="PGOWP Logo" />
                        </Link>
                    </div>
                    <div id="captionwrap" className="flex">
                        <Link to="/">PGOWP</Link>
                    </div>
                </div>
                <div id="linkdiv">
                    <ul id="linkul" className="flex-wrap justify-end overflow-hidden border-none flex pl-0 mb-0 mt-0">
                        <li id="navli" className="flex justify-center flex-wrap">
                            <Link to="/sign-in">Sign In</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

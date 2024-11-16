import "../../assets/css/header.css";
import "../../assets/css/hamburger.css";
import { Link, useLocation } from "react-router-dom";
import PGOWPLogo from "../../assets/images/favicon-96x96.png";
import { MdShoppingCart } from "react-icons/md";
import { useContext } from "react";
import { AppContext } from "../../App";

export default function Header({
    setCartDrawerOpen,
}: {
    setCartDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    // get the current page
    const location = useLocation();
    const { cart } = useContext(AppContext);
    // console.log("location.pathname:", location.pathname)

    return (
        <div
            id="header"
            style={{
                position: location.pathname === "/bdaycard" ? "relative" : "fixed",
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
                            <Link to="/services">Services</Link>
                            <Link to="/packages">Packages</Link>
                            <Link to="/gamelist">Game List</Link>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://www.google.com/maps/place/Prestigious+Gaming+On+Wheels+Plus/@40.6717448,-73.7831725,3a,98y,90t/data=!3m8!1e2!3m6!1sAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA!2e10!3e12!6shttps:%2F%2Flh5.googleusercontent.com%2Fp%2FAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA%3Dw203-h114-k-no!7i800!8i450!4m7!3m6!1s0x89c267ef4ab3d5c7:0x77d90889fb9bc7fc!8m2!3d40.671612!4d-73.7834759!14m1!1BCgIgAQ#"
                            >
                                Gallery
                            </a>
                            <Link to="/bdaycard">E-Invites</Link>
                            <Link to="/contactus" className="lists">
                                Contact
                            </Link>
                            <Link to="/about" className="right">
                                About
                            </Link>
                        </li>
                    </ul>
                </div>
                <div id="bbdiv" className="mx-0 text-[0rem] text-right">
                    {import.meta.env.PROD ? (
                        <a
                            target="_blank"
                            id="mobilebook"
                            className="px-5"
                            rel="noopener noreferrer"
                            href="https://ymonerhexbfwnegoml.10to8.com"
                        >
                            Book Online
                        </a>
                    ) : (
                        <Link to="/book" id="mobilebook" className="px-5">
                            Book Online
                        </Link>
                    )}
                </div>
            </div>
            {location.pathname === "/book" && (
                <button
                    id="cartbutton"
                    type="button"
                    title="Cart"
                    className={`bg-white rounded-full ml-4 relative ${cart.length > 0 ? "p-4" : "p-3"}`}
                    onClick={() => setCartDrawerOpen(true)}
                >
                    <MdShoppingCart size={35} />
                    {cart.length > 0 && (
                        <p className="absolute text-black text-xl bottom-2 right-3 font-bold w-fit">{cart.length}</p>
                    )}
                </button>
            )}
        </div>
    );
}

import React, { useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/css/header.css";
import { AppContext } from "../../App.tsx";
import PGOWPLogo from "../../assets/images/favicon-96x96.png";
import { MdShoppingCart } from "react-icons/md";
import Container from "react-bootstrap/Container";

const Header = ({
    drawerOpen,
    setDrawerOpen,
    setCartDrawerOpen,
}: {
    drawerOpen: boolean;
    setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCartDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const location = useLocation();
    const { currentpage, setcurrentpage, cart } = useContext(AppContext);
    console.log("currentpage:", currentpage);

    useEffect(() => {
        console.log("location.pathname:", location.pathname);
        if (location.pathname === "/services") setcurrentpage("Services");
        else if (location.pathname === "/packages") setcurrentpage("Packages");
        else if (location.pathname === "/") setcurrentpage("Home");
        else if (location.pathname === "/contact-us") setcurrentpage("Contact Us");
        else if (location.pathname === "/about") setcurrentpage("About");
        else if (location.pathname === "/bday-card") setcurrentpage("BDay Card");
        else if (location.pathname === "/e-invites") setcurrentpage("E-Invites");
        else if (location.pathname === "/book") setcurrentpage("Book");
        else if (location.pathname === "/checkout-details") setcurrentpage("Checkout Details");
    }, [location.pathname]);

    useEffect(() => {
        console.log("draweropen in hamnav:", drawerOpen);
    }, [drawerOpen]);

    return (
        <nav
            id="mobilenav"
            style={{
                position: currentpage === "BDay Card" ? "relative" : "fixed",
                display: location.pathname === "/e-invites" ? "none" : "flex",
            }}
            className={`navbar navbar-dropdown navbar-expand-lg opacityScroll ${drawerOpen ? "opened" : ""}`}
        >
            <Container id="headerdiv" className="bg-black">
                <div className="navbar-brand">
                    <div id="logo">
                        <Link to="/" id="logolink">
                            <img id="logoimg" src={PGOWPLogo} alt="PGOWP Logo" />
                        </Link>
                    </div>
                    <span className="navbar-caption-wrap">
                        <p className="navbar-caption text-info display-7">{currentpage}</p>
                    </span>
                </div>
                {currentpage === "Book" && (
                    <button id="cartbtn" type="button" onClick={() => setCartDrawerOpen(true)} title="Cart">
                        <MdShoppingCart color="white" size={30} />
                    </button>
                )}
                {/* <IoReorderThreeOutline
                    color="white"
                    size={50}
                    onClick={() => setDrawerOpen(true)}
                    className="cursor-pointer"
                /> */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-toggle="collapse"
                    data-bs-toggle="collapse"
                    data-target="#navbarSupportedContent"
                    data-bs-target="#navbarSupportedContent"
                    aria-expanded="true"
                    aria-label="Toggle navigation"
                    onClick={() => setDrawerOpen(!drawerOpen)}
                >
                    <div className="hamburger">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
                {/* 
                    navbar-collapse opacityScroll collapse
                    navbar-collapse opacityScroll collapse show
                */}
                <div
                    className={`navbar-collapse opacityScroll collapse ${drawerOpen ? "show" : ""}`}
                    id="navbarSupportedContent"
                >
                    <ul className="navbar-nav nav-dropdown" data-app-modern-menu="true">
                        {["Home", "Services", "Packages", "Gallery", "E-Invites", "Contact Us", "About"].map(
                            (text, index) =>
                                text === "Gallery" ? (
                                    <li
                                        key={index}
                                        id="galleryli"
                                        onClick={() => setDrawerOpen(false)}
                                        className="nav-item"
                                    >
                                        <a
                                            className="nav-link link display-4"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href="https://www.google.com/maps/place/Prestigious+Gaming+On+Wheels+Plus/@40.6717448,-73.7831725,3a,98y,90t/data=!3m8!1e2!3m6!1sAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA!2e10!3e12!6shttps:%2F%2Flh5.googleusercontent.com%2Fp%2FAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA%3Dw203-h114-k-no!7i800!8i450!4m7!3m6!1s0x89c267ef4ab3d5c7:0x77d90889fb9bc7fc!8m2!3d40.671612!4d-73.7834759!14m1!1BCgIgAQ#"
                                        >
                                            Gallery
                                        </a>
                                    </li>
                                ) : (
                                    <li key={index} className="nav-item">
                                        <Link
                                            key={index}
                                            to={
                                                text === "E-Invites"
                                                    ? "/bday-card"
                                                    : index === 0
                                                    ? "/"
                                                    : `/${text.split(" ").join("-").toLowerCase()}`
                                            }
                                            onClick={() => setDrawerOpen(false)}
                                            className="nav-link link display-4"
                                        >
                                            {text}
                                        </Link>
                                    </li>
                                )
                        )}
                    </ul>
                    <div className="navbar-buttons section-btn">
                        {import.meta.env.PROD ? (
                            <a
                                className="btn btn-secondary display-4"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://app.10to8.com/book/ymonerhexbfwnegoml/"
                            >
                                Book Now
                            </a>
                        ) : (
                            <Link className="btn btn-secondary display-4" to="/book">
                                Book Now
                            </Link>
                        )}
                    </div>
                </div>
            </Container>
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
        </nav>
    );
};

export default Header;

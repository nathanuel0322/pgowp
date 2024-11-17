import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import CloseIcon from "@mui/icons-material/Close";
import "../../assets/css/sidedrawer.css";
import { Link } from "react-router-dom";
import { IconButton } from "@mui/material";

export default function SideDrawer({
    drawerOpen,
    setDrawerOpen,
}: {
    drawerOpen: boolean;
    setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    return (
        <SwipeableDrawer anchor={"right"} open={drawerOpen} onOpen={() => {}} onClose={() => setDrawerOpen(false)}>
            <div>
                <div>
                    <IconButton onClick={() => setDrawerOpen(false)} sx={{ justifyContent: "flex-start" }}>
                        <CloseIcon fontSize="small" sx={{ width: 1 / 4, height: 1 / 4, color: "white" }} />
                    </IconButton>
                </div>
                <div id="sidedrawerdiv">
                    {[
                        "Home",
                        "Services",
                        "Packages",
                        "Game List",
                        "Gallery",
                        "E-Invites",
                        "Contact Us",
                        "About",
                        "Book Online",
                    ].map((text, index) =>
                        index === 8 ? (
                            <li id="booknowli" key={index} onClick={() => setDrawerOpen(false)}>
                                {import.meta.env.PROD ? (
                                    <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        href="https://app.10to8.com/book/ymonerhexbfwnegoml/"
                                    >
                                        Book Now
                                    </a>
                                ) : (
                                    <Link to="/book">Book Now</Link>
                                )}
                            </li>
                        ) : index === 4 ? (
                            <li key={index} id="galleryli" onClick={() => setDrawerOpen(false)}>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://www.google.com/maps/place/Prestigious+Gaming+On+Wheels+Plus/@40.6717448,-73.7831725,3a,98y,90t/data=!3m8!1e2!3m6!1sAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA!2e10!3e12!6shttps:%2F%2Flh5.googleusercontent.com%2Fp%2FAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA%3Dw203-h114-k-no!7i800!8i450!4m7!3m6!1s0x89c267ef4ab3d5c7:0x77d90889fb9bc7fc!8m2!3d40.671612!4d-73.7834759!14m1!1BCgIgAQ#"
                                >
                                    Gallery
                                </a>
                            </li>
                        ) : (
                            <Link
                                id="linka"
                                key={index}
                                to={
                                    text === "E-Invites"
                                        ? "/bday-card"
                                        : index === 0
                                        ? "/"
                                        : `/${text.split(" ").join("").toLowerCase()}`
                                }
                                onClick={() => setDrawerOpen(false)}
                            >
                                {text}
                            </Link>
                        )
                    )}
                </div>
            </div>
        </SwipeableDrawer>
    );
}

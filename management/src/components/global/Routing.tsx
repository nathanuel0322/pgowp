import { useMediaQuery } from "react-responsive";
import HamburgerNav from "./HamburgerNav";
import { useContext, useEffect, useState } from "react";
import SideDrawer from "./SideDrawer";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Home from "../../screens/Home";
import Header from "./Header";
import LoginScreen from "../../screens/LoginScreen";
import Dashboard from "../../screens/Dashboard";
import { AuthContext } from "../../App";
import { supabase } from "../../supabase";
import { toastError } from "../../GlobalFunctions";
import ResetPassword from "../../screens/ResetPassword";
import VerifyMFA from "../../screens/VerifyMFA";
import PuffLoader from "react-spinners/PuffLoader";

export default function Routing() {
    const navigate = useNavigate();
    const location = useLocation();
    const hamburgerdetector = useMediaQuery({ query: "(max-width: 991px)" });
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const { session, setSession } = useContext(AuthContext);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfafinished, setMfafinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const mfa_passed = localStorage.getItem("mfa_passed");
                // if it exists, check if it's true
                if (mfa_passed) {
                    // if it's true, user completed mfa
                    if (JSON.parse(mfa_passed)) {
                        setMfafinished(true);
                    } else {
                        // if it's false, make sure user completes mfa before proceeding
                        setMfaRequired(true);
                    }
                }
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("Error getting session:", error);
                    toastError("Error signing in. Please try again later.");
                    return;
                }
                // console.log("data:", data);
                if (data.session) {
                    setSession({
                        ...data.session,
                        user: {
                            ...data.session.user,
                            role:
                                data.session.user.email === "tbnd@prestigiousgamingonwheelsplus.com"
                                    ? "admin"
                                    : "employee",
                        },
                    });
                } else setIsLoading(false);
            } catch (error) {
                console.error("Error during initial session check:", error);
                setIsLoading(false);
            }
        })();

        supabase.auth.onAuthStateChange(async (_event, session) => {
            // console.log("auth state change");
            try {
                if (_event === "PASSWORD_RECOVERY") {
                    // this is the only way /resetpassword can be accessed
                    navigate("/reset-password", { state: { isPasswordRecovery: true } });
                }

                // if session is true and mfa is not required, set session and user
                if (session && !mfaRequired) {
                    setSession({
                        ...session,
                        user: {
                            ...session.user,
                            role:
                                session.user.email === "tbnd@prestigiousgamingonwheelsplus.com" ? "admin" : "employee",
                        },
                    });
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error during auth state change:", error);
                setIsLoading(false);
            }
        });
    }, []);

    if (isLoading) {
        return <PuffLoader color={"#5D87FF"} loading={true} size={150} id="loader" />;
    }

    // console.log("mfa required:", mfaRequired, "\n\nmfa finished:", mfafinished);

    if (mfaRequired && !mfafinished) {
        return <VerifyMFA setMfafinished={setMfafinished} />;
    }

    return (
        <div id="routing-div" className={`${location.pathname === "/checkout" ? "px-[2%]" : "px-[5vw]"}`}>
            {hamburgerdetector ? <HamburgerNav setDrawerOpen={setDrawerOpen} /> : <Header />}
            <SideDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
            <Routes>
                <Route path="/" element={session ? <Dashboard /> : <Home />} />
                <Route
                    path="/sign-in"
                    element={
                        session ? (
                            <Navigate to="/" />
                        ) : (
                            <LoginScreen mfaRequired={mfaRequired} setMfaRequired={setMfaRequired} />
                        )
                    }
                />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
        </div>
    );
}

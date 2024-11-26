import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toastError, toastPromise } from "../GlobalFunctions.js";
import { supabase } from "../supabase.js";
import "../assets/css/loginscreen.css";

export default function LoginScreen({
    mfaRequired,
    setMfaRequired,
}: {
    mfaRequired: boolean;
    setMfaRequired: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const navigate = useNavigate();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loginclicked, setLoginclicked] = useState<boolean>(false);

    return (
        <div className="authdiv justify-center authbox logindiv text-white">
            <p className="createacc">Login</p>
            <div className="authform">
                <input
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email-address"
                    autoCapitalize="none"
                    autoCorrect="false"
                    autoComplete="false"
                />
                <input type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                <button
                    disabled={loginclicked}
                    className="actionbtn"
                    onClick={async () => {
                        setLoginclicked(true);
                        toastPromise(
                            new Promise<void>((resolve, reject) => {
                                if (email === "" && password === "") {
                                    reject("Please enter your email and password.");
                                } else if (email === "") {
                                    reject("Please enter your email.");
                                } else if (password === "") {
                                    reject("Please enter your password.");
                                }
                                if (!email.includes("@")) {
                                    reject("Please enter a valid email.");
                                }
                                supabase.auth
                                    .signInWithPassword({
                                        email,
                                        password,
                                    })
                                    .then(({ data, error }) => {
                                        // if there's no error, the user is taken straight to the home page / Routing.tsx,
                                        // so handle accordingly
                                        if (error) {
                                            console.error("Error signing in:", error);
                                            reject(error.message);
                                        } else {
                                            supabase
                                                .from("users")
                                                .select("*, widgets(*), mfa_secret")
                                                .eq("id", data.user.id)
                                                .single()
                                                .then(({ data: userdata, error: usererror }) => {
                                                    if (usererror) {
                                                        console.error(
                                                            "Error fetching user data on LoginScreen:",
                                                            usererror
                                                        );
                                                        reject(usererror.message);
                                                    }
                                                    if (userdata?.mfa_secret) {
                                                        localStorage.setItem("mfa_passed", "false");
                                                        // MFA is enabled, prompt for MFA code
                                                        // console.log("MFA enabled");
                                                        setMfaRequired(true);
                                                    }
                                                    resolve();
                                                });
                                        }
                                    });
                            }),
                            "Signing in...",
                            // we need to differentiate whether user needs to fill in mfa
                            () => {
                                if (mfaRequired) {
                                    return "";
                                } else {
                                    navigate("/widgets");
                                    return "Signed in!";
                                }
                            }
                        );
                        setLoginclicked(false);
                    }}
                >
                    Log In
                </button>
            </div>
            <button
                type="button"
                className="actionbtn min-w-[165px]"
                onClick={async () => {
                    if (email === "") {
                        toastError("Please enter your email.");
                        return;
                    }
                    if (email.includes("@")) {
                        toastPromise(
                            new Promise<void>((resolve, reject) => {
                                const resetLink = `${window.location.origin}/resetpassword`;
                                supabase.auth
                                    .resetPasswordForEmail(email, {
                                        redirectTo: resetLink,
                                    })
                                    .then(({ error: reseterror }) => {
                                        if (reseterror) {
                                            console.error("Error sending password reset:", reseterror);
                                            reject(reseterror?.message || "An error occurred.");
                                        }
                                        resolve();
                                    });
                            }),
                            "Sending password reset email...",
                            "Your password reset has been sent to your email. Make sure to check your spam folder."
                        );
                    } else {
                        toastError("Please enter a valid email.");
                    }
                }}
            >
                Forgot Password?
            </button>
        </div>
    );
}

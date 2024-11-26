import { useContext, useState } from "react";
import { apilink, toastPromise } from "../GlobalFunctions";
import { AuthContext } from "../App";
import { useNavigate } from "react-router-dom";

export default function VerifyMFA({
    setMfafinished,
}: {
    setMfafinished: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const navigate = useNavigate();
    const { session } = useContext(AuthContext);
    const [mfaCode, setMfaCode] = useState("");

    return (
        <div className="authdiv justify-center authbox logindiv">
            <input
                type="text"
                className="max-w-[200px] !text-black"
                placeholder="MFA Code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                maxLength={6}
            />
            <button
                type="button"
                className="actionbtn"
                onClick={async () => {
                    toastPromise(
                        new Promise<void>((resolve, reject) => {
                            try {
                                fetch(apilink + "/verify-mfa", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${session?.access_token}`,
                                    },
                                    // body: JSON.stringify({ token: mfaCode }),
                                })
                                    .then((res) => res.json())
                                    .then((data) => {
                                        if (data.message === "Success") {
                                            setMfafinished(true);
                                            navigate("/widgets");
                                            localStorage.setItem("mfa_passed", "true");
                                            resolve();
                                        } else {
                                            reject(data.message);
                                        }
                                    })
                                    .catch((error) => {
                                        console.error("Error verifying MFA:", error);
                                        reject("Error verifying MFA. Please try again.");
                                    });
                            } catch (error) {
                                console.error("MFA verification error:", error);
                                reject("MFA verification failed. Please try again.");
                            }
                        }),
                        "Verifying MFA...",
                        "MFA Verified!"
                    );
                }}
            >
                Verify MFA
            </button>
        </div>
    );
}

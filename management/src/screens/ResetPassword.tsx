import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { toastError, toastSuccess } from "../GlobalFunctions";
import PuffLoader from "react-spinners/PuffLoader";
import "../assets/css/resetpassword.css";

export default function ResetPassword() {
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [buttonpressed, setButtonPressed] = useState(false);
    const [isValidState, setIsValidState] = useState<boolean>(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const state = location.state as { isPasswordRecovery: boolean };

        if (!state?.isPasswordRecovery) {
            console.error("Unauthorized access.");
            toastError("Unauthorized access.");
            navigate("/login");
        } else {
            setIsValidState(true);
        }
    }, []);

    if (!isValidState) {
        return <PuffLoader color={"#5D87FF"} loading={true} size={150} id="loader" />;
    }

    return (
        <div id="resetpassworddiv" className="">
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <input
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                type="password"
                className="!w-auto"
            />
            <input
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                type="password"
                className="!w-auto"
            />
            <button
                type="button"
                className="actionbtn"
                onClick={async () => {
                    setButtonPressed(true);
                    if (newPassword === confirmPassword) {
                        const { error } = await supabase.auth.updateUser({ password: newPassword });
                        if (error) {
                            console.error("Error updating password:", error);
                            toastError(error.message);
                        } else {
                            toastSuccess("Password updated successfully!");
                            navigate("/");
                        }
                    } else {
                        toastError("Passwords do not match. Try again.");
                    }
                    setButtonPressed(false);
                }}
                disabled={buttonpressed}
            >
                Reset Password
            </button>
        </div>
    );
}

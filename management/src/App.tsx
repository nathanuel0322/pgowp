import React, { createContext, useState } from "react";
import "./assets/css/home.css";
import { Toaster } from "react-hot-toast";
import Routing from "./components/global/Routing.tsx";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { toastPromise } from "./GlobalFunctions.tsx";
import { supabase } from "./supabase.ts";

export interface User extends SupabaseUser {
    name?: string;
    mfa_secret?: string;
}

interface AuthContextType {
    user: User | undefined;
    setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
    session: Session | undefined;
    setSession: React.Dispatch<React.SetStateAction<Session | undefined>>;
    logout: () => Promise<void>;
    currentpage: string | null;
    setcurrentpage: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AuthContext = createContext<AuthContextType>({
    user: undefined,
    setUser: () => {},
    session: undefined,
    setSession: () => {},
    logout: async () => {},
    currentpage: null,
    setcurrentpage: () => {},
});

function App() {
    const [user, setUser] = useState<User | undefined>(undefined);
    const [session, setSession] = useState<Session | undefined>(undefined);
    const [currentpage, setcurrentpage] = useState<string | null>(null);
    // console.log("user:", user);

    return (
        <AuthContext.Provider
            value={{
                currentpage,
                setcurrentpage,
                user,
                setUser,
                session,
                setSession,
                logout: async () => {
                    toastPromise(
                        new Promise<void>((resolve, reject) => {
                            supabase.auth.signOut().then(({ error }) => {
                                if (error) reject(error.message);
                                else {
                                    localStorage.removeItem("mfa_passed");
                                    resolve();
                                }
                            });
                        }),
                        "Logging out...",
                        "Logged out!"
                    );
                },
            }}
        >
            <Routing />
            <Toaster
                position="top-center"
                containerClassName="!flex !flex-row !items-center !justify-center !font-[Figtree] font-semibold"
            />
        </AuthContext.Provider>
    );
}

export default App;

import React, { createContext, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import Routing from "./components/global/Routing.tsx";
import type { CartItem } from "./screens/Book.tsx";
import ScrollToTop from "./components/global/ScrollToTop.tsx";

interface AppContextType {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const AppContext = createContext<AppContextType>({
    cart: [],
    setCart: () => {},
});

function App() {
    const [cart, setCart] = useState<CartItem[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("cart");
            if (saved) setCart(JSON.parse(saved));
        } catch {
            /* storage unavailable */
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem("cart", JSON.stringify(cart));
        } catch {
            /* storage unavailable */
        }
    }, [cart]);

    return (
        <AppContext.Provider value={{ cart, setCart }}>
            <ScrollToTop />
            <Routing />
            <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Manrope, sans-serif", fontWeight: 600 } }} />
        </AppContext.Provider>
    );
}

export default App;

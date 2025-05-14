import React, { createContext, useEffect, useState } from "react";
import "./assets/css/home.css";
import { Toaster } from "react-hot-toast";
import Routing from "./components/global/Routing.tsx";
import { CartItem } from "./screens/Book.tsx";
import ScrollToTop from "./components/global/ScrollToTop.tsx";

interface AppContextType {
    currentpage: string | null;
    setcurrentpage: React.Dispatch<React.SetStateAction<string | null>>;
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const AppContext = createContext<AppContextType>({
    currentpage: null,
    setcurrentpage: () => {},
    cart: [],
    setCart: () => {},
});

function App() {
    const [currentpage, setcurrentpage] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);

    useEffect(() => {
        const cart = localStorage.getItem("cart");
        if (cart) setCart(JSON.parse(cart));
    }, []);

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    return (
        <AppContext.Provider
            value={{
                currentpage,
                setcurrentpage,
                cart,
                setCart,
            }}
        >
            <ScrollToTop />
            <Routing />
            <Toaster
                position="top-center"
                containerClassName="!flex !flex-row !items-center !justify-center !font-[Figtree] font-semibold"
            />
        </AppContext.Provider>
    );
}

export default App;

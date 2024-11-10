import React, { createContext, useState } from "react";
import "./assets/css/home.css";
import { Toaster } from "react-hot-toast";
import Routing from "./components/global/Routing.tsx";
import { CartItem } from "./screens/Book.tsx";

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

    return (
        <AppContext.Provider
            value={{
                currentpage,
                setcurrentpage,
                cart,
                setCart,
            }}
        >
            <Routing />
            <Toaster position="top-center" containerClassName="!flex !flex-row !items-center !justify-center" />
        </AppContext.Provider>
    );
}

export default App;

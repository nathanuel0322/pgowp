import React, { createContext, useState } from "react";
import "./assets/css/home.css";
import { Toaster } from "react-hot-toast";
import Routing from "./components/global/Routing.tsx";

interface AppContextType {
    currentpage: string | null;
    setcurrentpage: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AppContext = createContext<AppContextType>({
    currentpage: null,
    setcurrentpage: () => {},
});

function App() {
    const [currentpage, setcurrentpage] = useState<string | null>(null);

    return (
        <AppContext.Provider
            value={{
                currentpage,
                setcurrentpage,
            }}
        >
            <Routing />
            <Toaster position="top-center" containerClassName="!flex !flex-row !items-center !justify-center" />
        </AppContext.Provider>
    );
}

export default App;

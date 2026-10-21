import { Toaster } from "react-hot-toast";
import Routing from "./components/global/Routing.tsx";
import ScrollToTop from "./components/global/ScrollToTop.tsx";

function App() {
    return (
        <>
            <ScrollToTop />
            <Routing />
            <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Manrope, sans-serif", fontWeight: 600 } }} />
        </>
    );
}

export default App;

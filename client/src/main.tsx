import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

const container = document.getElementById("root")!;
const app = (
    <BrowserRouter>
        <App />
    </BrowserRouter>
);

// Pages are prerendered at build time. Hydrate when the HTML matches this URL; otherwise
// (dev server, SPA fallback, booking routes) render from scratch.
const path = window.location.pathname.replace(/\/+$/, "") || "/";
if (container.dataset.prerendered === path) {
    ReactDOM.hydrateRoot(container, app);
} else {
    container.innerHTML = "";
    ReactDOM.createRoot(container).render(app);
}

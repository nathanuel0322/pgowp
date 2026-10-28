import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    // Online booking needs the Google Maps key to verify party addresses, so a production build without it would leave
    // nobody able to book. Fail the build instead, which keeps the last good deployment live.
    if (command === "build" && mode === "production" && !loadEnv(mode, process.cwd(), "VITE_").VITE_GOOGLE_MAPS_KEY) {
        throw new Error("VITE_GOOGLE_MAPS_KEY isn't set. Add it to the Pages project's variables (or client/.env.local).");
    }
    return {
        plugins: [react(), svgr()],
        css: {
            devSourcemap: true,
        },
        optimizeDeps: {
            exclude: ["bcrypt"],
        },
        ssr: {
            // react-icons v4 ships ESM that Node can't load directly, so bundle it into the prerender build.
            noExternal: ["react-icons"],
        },
        resolve: {
            extensions: [".js", ".jsx", ".ts", ".tsx"], // Ensure these extensions are resolved
        },
    };
});

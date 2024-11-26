import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), svgr()],
    css: {
        devSourcemap: true,
    },
    optimizeDeps: {
        exclude: ["bcrypt"],
    },
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"], // Ensure these extensions are resolved
    },
});

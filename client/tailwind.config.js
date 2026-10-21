/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                display: ['"Unbounded"', "system-ui", "sans-serif"],
                sans: ['"Manrope"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
            },
            colors: {
                // Brand system for the public site
                ink: "#07070b",
                surface: "#0f0f16",
                raised: "#16161f",
                line: "rgba(255,255,255,0.08)",
                gold: { DEFAULT: "#ffb02e", soft: "#ffd27a", deep: "#e88f00" },
                volt: { DEFAULT: "#3b5bff", soft: "#8ea0ff" },
                fog: "#a3a3b8",
            },
            maxWidth: {
                site: "76rem",
            },
            keyframes: {
                marquee: {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(-50%)" },
                },
                rise: {
                    from: { opacity: "0", transform: "translateY(16px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                marquee: "marquee 40s linear infinite",
                rise: "rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both",
            },
        },
    },
    plugins: [],
    corePlugins: {
        container: false,
    },
};

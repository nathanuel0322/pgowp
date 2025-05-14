/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            screens: {
                mobiles: "320px",
                mobilem: "375px",
                mobilel: "425px",
                atleast600: "600px",
                atleast769: "769px",
                under769: { max: "768px" },
            },
            colors: {
                primary: "#0a2a3e",
                secondary: "#FFF5CF",
                custom_red: "#E91858",
                custom_light_blue: "#a9dcd4",
                custom_gray: "#F5F5F580",
                dark_gray: "#D9D9D9",
                text_gray: "#979797",
                light_green: "#A7E996",
                extra_light_gray: "#AAB2B5",
            },
        },
    },
    plugins: [],
    corePlugins: {
        container: false,
    },
};

import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0f1115",
                surface: "#1a1d24",
                primary: "#3b82f6",
                primary_hover: "#2563eb",
                border: "#2d3340",
            },
        },
    },
    plugins: [],
};
export default config;

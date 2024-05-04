import type {Config} from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            keyframes: {
                "spinner": {
                    from: {
                        transform: "rotate(0)",
                    },
                    to: {
                        transform: "rotate(360deg)",
                    }
                },
                "dialog-in": {
                    from: {
                        opacity: "0",
                        transform: "translate(-50%, -50%) scale(0.9)",
                    },
                    to: {
                        transform: "translate(-50%, -50%) scale(1)",
                    },
                },
                "dialog-out": {
                    from: {
                        transform: "translate(-50%, -50%)",
                    },
                    to: {
                        opacity: "0",
                        transform: "translate(-50%, -50%) scale(0.9)",
                    },
                },
                "popover-in": {
                    from: {
                        opacity: "0",
                        transform: "translateY(20px)",
                    },
                    to: {
                        transform: "translateY(0)",
                    },
                },
                "popover-out": {
                    from: {
                        transform: "translateY(0)",
                    },
                    to: {
                        opacity: "0",
                        transform: "translateY(20px)",
                    },
                },
                "fade-in": {
                    from: {
                        opacity: "0",
                    },
                    to: {
                        opacity: "1",
                    },
                },
                "fade-out": {
                    from: {
                        opacity: "1",
                    },
                    to: {
                        opacity: "0",
                    },
                },
            },
            animation: {
                "dialog-in": "dialog-in 200ms ease-out",
                "dialog-out": "dialog-out 200ms ease-out",
                "overlay-in": "fade-in 200ms ease-out",
                "overlay-out": "fade-out 200ms ease-out",
                "popover-in": "popover-in 200ms ease-out",
                "popover-out": "popover-out 200ms ease-out",
                "spinner": "spinner 800ms linear infinite"
            },
        },
    },
    plugins: [],
};
export default config;

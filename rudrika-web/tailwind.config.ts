import type { Config } from "tailwindcss";

// Rudrika by Tara brand kit (Playbook): Soft Ivory, Warm Gold, Deep Maroon, Midnight Blue.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fff7f0", // Soft Ivory
        sand: "#f6ebe0", // between ivory and gold
        ink: "#0e0f1e", // Midnight Blue
        clay: { DEFAULT: "#471113", dark: "#2f0a0c", light: "#6a1a1e" }, // Deep Maroon
        gold: { DEFAULT: "#c4a580", light: "#dcc4a6", dark: "#9c7d55" }, // Warm Gold
        accent: { DEFAULT: "#f47631", flame: "#f26422", red: "#d44827" }, // use sparingly
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        body: ['"Jost"', "system-ui", "sans-serif"],
        script: ['"Great Vibes"', "cursive"],
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-up": "fadeUp 0.7s ease-out both",
        "fade-up-slow": "fadeUp 1s ease-out both",
        "fade-in": "fadeIn 1.2s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;

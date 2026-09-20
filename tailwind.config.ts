import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#07050F", panel: "#120D22" },
        neon: {
          blue: "#3B82F6",
          purple: "#A855F7",
          violet: "#7C3AED",
          pink: "#EC4899",
          cyan: "#28E4E0",
          green: "#3EE089",
          orange: "#FF7A45",
          red: "#FF4D6D",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Rajdhani", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(168,85,247,0.4)",
        glowBlue: "0 0 24px rgba(59,130,246,0.4)",
        glowPink: "0 0 24px rgba(236,72,153,0.35)",
        glowPurple: "0 0 24px rgba(124,58,237,0.45)",
      },
      backgroundImage: {
        "gamer-gradient": "linear-gradient(135deg, #7C3AED 0%, #A855F7 45%, #EC4899 100%)",
        "gamer-gradient-soft": "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.2))",
      },
    },
  },
  plugins: [],
};
export default config;
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#070B14", panel: "#0D1322" },
        neon: {
          blue: "#3DA9FC",
          purple: "#A259FF",
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
        glow: "0 0 20px rgba(61,169,252,0.35)",
        glowPurple: "0 0 20px rgba(162,89,255,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      colors: {
        bg: "#0d0e14",
        surface: "#13141d",
        surface2: "#1a1b27",
        border: "#2a2b3d",
        muted: "#6b6c80",
        accent: "#4ade80",
        buy: "#4ade80",
        sell: "#f87171",
      },
    },
  },
  plugins: [],
};

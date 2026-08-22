/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f1219",
        panel: "#1a2332",
        border: "#2d3a4f",
        muted: "#8f9bb5",
        accent: "#f97316",
        accent2: "#fbbf24",
        good: "#4ade80",
        bad: "#ef4444",
      },
      borderRadius: {
        xl2: "24px",
        xl3: "28px",
      },
    },
  },
  plugins: [],
};

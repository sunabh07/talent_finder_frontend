/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff", 100: "#d9e6ff", 200: "#bcd3ff", 300: "#8eb5ff",
          400: "#598dff", 500: "#3366f2", 600: "#2048d6", 700: "#1a39ad",
          800: "#1b3389", 900: "#1c2f6d",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.08)",
      },
    },
  },
  plugins: [],
};

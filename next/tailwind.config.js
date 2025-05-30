/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "brand-1": "var(--color-primary)", // Replace with your brand color
        "brand-2": "var(--color-secondary)", // Replace with your brand color
        "brand-3": "var(--color-tertiary)", // Replace with your brand color
      },
      fontFamily: {
        primary: ["var(--font-inter)", "Inter", "sans-serif"],
        secondary: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      fontWeight: {
        black: "900",
      },
    },
  },
  plugins: [],
};

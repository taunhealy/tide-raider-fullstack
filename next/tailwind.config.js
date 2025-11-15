/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-1": "var(--color-primary)",
        "brand-2": "var(--color-secondary)",
        "brand-3": "var(--color-tertiary)",
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

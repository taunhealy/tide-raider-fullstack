const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-1": "var(--color-primary)",
        "brand-2": "var(--color-secondary)",
        "brand-3": "var(--color-tertiary)",
        "brand-dark-blue": "var(--color-brand-dark-blue)",
        "brand-blue-dark": "var(--color-brand-blue-dark)",
        "brand-blue-primary": "var(--color-brand-blue-primary)",
        "brand-blue-medium": "var(--color-brand-blue-medium)",
        "brand-blue-light": "var(--color-brand-blue-light)",
        "brand-blue-muted": "var(--color-brand-blue-muted)",
        "brand-gray": "var(--color-brand-gray)",
        "brand-label-heading": "var(--color-brand-label-heading)",
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

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Enables class-based dark mode support
  content: [
    "./src/**/*.{js,jsx,ts,tsx}" // Scan all relevant files for class names
  ],
  theme: {
    extend: {
      animation: {
        float: "float 3s ease-in-out infinite",
        hoverFloat: "float 0.6s ease-in-out", // For hover effect (used on icons or buttons)
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#ff6b00",
          yellow: "#ffc107",
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        confetti: {
          primary: "#AA21FF",
          secondary: "#E6BCFF", 
          accent: "#C8E9C7",
          highlight: "#FDCC93",
          // Add more confetti colors as needed
          blue: "#60A5FA",
          green: "#34D399",
          yellow: "#FBBF24",
          red: "#F87171",
          purple: "#A78BFA",
          pink: "#F472B6"
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'unwiku-blue': '#003366',
        'success-green': '#10B981',
        'error-red': '#EF4444',
        'warning-yellow': '#F59E0B',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'], // Menggunakan Inter sebagai font utama
      },
    },
  },
  plugins: [],
}
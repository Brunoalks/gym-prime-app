/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Isso força o app inteiro a usar Poppins
      },
      colors: {
        gymGreen: '#10B981',
        gymPurple: '#8A2BE2',
        gymDark: '#111827'
      }
    },
  },
  plugins: [],
}
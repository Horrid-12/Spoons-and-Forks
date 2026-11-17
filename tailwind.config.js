/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Epilogue', 'system-ui', 'sans-serif'],
        mono: ['Epilogue', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

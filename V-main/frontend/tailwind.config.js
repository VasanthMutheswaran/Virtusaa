/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          light: 'var(--primary-light)',
          50: '#eff6ff',    /* blue-50 */
          500: '#3b82f6',   /* blue-500 */
          600: '#2563eb',   /* blue-600 */
          700: '#1d4ed8',   /* blue-700 */
        },
        secondary: {
          DEFAULT: '#60a5fa',
          500: '#60a5fa',   /* blue-400 (light blue) */
        }
      }
    },
  },
  plugins: [],
}

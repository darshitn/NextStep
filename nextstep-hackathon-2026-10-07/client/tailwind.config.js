/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: {
          50: '#1A2234',
          100: '#141B2D',
          200: '#0F1524',
          300: '#0B0F19',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        emerald: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 20px -5px rgba(99, 102, 241, 0.4)',
      }
    },
  },
  plugins: [],
}

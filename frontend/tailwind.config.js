/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ivory: {
          50: '#FDFCF8',
          100: '#F9F6EE',
          200: '#F2ECD8',
        },
        teal: {
          950: '#012A2A',
          900: '#023535',
          800: '#044040',
          700: '#065050',
          600: '#0A7070',
          500: '#0E9090',
          400: '#15AFAF',
          300: '#2ECECE',
          200: '#6EE2E2',
          100: '#B5F2F2',
          50:  '#E5FAFA',
        },
        coral: {
          600: '#C94040',
          500: '#E85050',
          400: '#F06060',
          300: '#F58080',
        }
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
}

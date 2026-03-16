/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        primary: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          subtle: '#eef2ff', // indigo-50
        },
        slate: {
          200: '#e2e8f0',
          300: '#cbd5e1',
          500: '#64748b',
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569',
        }
      },
      borderRadius: {
        'xl': '0.75rem',
        'lg': '0.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

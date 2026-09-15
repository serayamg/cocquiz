/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          navy: '#0A0F24',
          navyLight: '#141D38',
          card: '#182247',
          border: '#2A3B6E',
          blue: '#3B82F6',
          blueDark: '#1D4ED8',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
          teal: '#14B8A6',
          amber: '#F59E0B',
          emerald: '#10B981',
          rose: '#EF4444',
          gold: '#FBBF24',
          silver: '#94A3B8',
          bronze: '#B45309',
        },
        option: {
          a: '#2563EB', // Blue
          b: '#7C3AED', // Purple
          c: '#0D9488', // Teal
          d: '#EA580C', // Orange
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounce 0.5s ease-in-out 2',
        'fade-in': 'fadeIn 0.3s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

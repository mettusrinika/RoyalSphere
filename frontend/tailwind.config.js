/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          blue: '#0B1B34',
          navy: '#020817',
          gold: '#C9A227',
          'light-gold': '#E2C15A',

          50: '#F8FAFC',
          100: '#E2E8F0',
          200: '#CBD5E1',
          500: '#16325C',
          600: '#0B1B34',
          700: '#061226',
        },

        gold: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          300: '#E2C15A',
          500: '#C9A227',
          600: '#A8841F',
          700: '#806516',
        },

        background: '#020817',
        foreground: '#F8FAFC',
        border: 'rgba(201, 162, 39, 0.24)',
        muted: '#94A3B8',
        accent: '#C9A227',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },

      boxShadow: {
        royal: '0 18px 50px rgba(0, 0, 0, 0.32)',
        gold: '0 0 30px rgba(201, 162, 39, 0.12)',
        card: '0 12px 36px rgba(0, 0, 0, 0.24)',
        'card-hover': '0 22px 60px rgba(0, 0, 0, 0.38)',
      },

      backgroundImage: {
        'royal-gradient':
          'linear-gradient(135deg, #020817 0%, #061226 52%, #0B1B34 100%)',

        'gold-gradient':
          'linear-gradient(135deg, #A8841F 0%, #C9A227 45%, #E2C15A 100%)',

        'hero-gradient':
          'radial-gradient(circle at 78% 18%, rgba(22,50,92,0.58), transparent 34%), linear-gradient(135deg, #020817 0%, #061226 55%, #0B1B34 100%)',
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },

        slideUp: {
          '0%': {
            transform: 'translateY(16px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },

        pulseGold: {
          '0%,100%': {
            boxShadow: '0 0 0 0 rgba(201,162,39,0.28)',
          },
          '50%': {
            boxShadow: '0 0 0 8px rgba(201,162,39,0)',
          },
        },
      },
    },
  },
  plugins: [],
};
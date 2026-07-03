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
          blue: '#0B1F5B',
          navy: '#08163F',
          gold: '#D4AF37',
          'light-gold': '#F4E6A1',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#1a3a8f',
          600: '#0B1F5B',
          700: '#08163F',
        },
        gold: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          300: '#F4E6A1',
          500: '#D4AF37',
          600: '#B8962E',
          700: '#92750F',
        },
        background: '#F8FAFC',
        foreground: '#0F172A',
        border: '#E2E8F0',
        muted: '#64748B',
        accent: '#D4AF37',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'royal': '0 4px 24px rgba(11, 31, 91, 0.12)',
        'gold': '0 4px 24px rgba(212, 175, 55, 0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 40px rgba(11, 31, 91, 0.12)',
      },
      backgroundImage: {
        'royal-gradient': 'linear-gradient(135deg, #0B1F5B 0%, #1a3a8f 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F4E6A1 100%)',
        'hero-gradient': 'linear-gradient(135deg, #08163F 0%, #0B1F5B 50%, #1a3a8f 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(212,175,55,0)' } },
      },
    },
  },
  plugins: [],
};

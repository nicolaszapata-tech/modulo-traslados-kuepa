/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00FFD1',
          dark: '#00CCA8',
          light: '#66FFE4',
          glow: 'rgba(0, 255, 209, 0.4)'
        },
        secondary: {
          DEFAULT: '#FF6B35',
          dark: '#CC5529',
          light: '#FF8F66',
          glow: 'rgba(255, 107, 53, 0.4)'
        },
        background: {
          DEFAULT: '#0A0E27',
          card: '#1A1F3A',
          elevated: '#242B4D',
          overlay: 'rgba(10, 14, 39, 0.95)'
        },
        text: {
          primary: '#E8F4F8',
          secondary: '#A0B3C0',
          muted: '#6B7A8F'
        },
        status: {
          active: '#00FF88',
          development: '#FFA500',
          locked: '#666F8C',
          error: '#FF4444',
          success: '#00FF88'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'sans-serif']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 255, 209, 0.4)',
        'glow-orange': '0 0 20px rgba(255, 107, 53, 0.4)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.4)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 12px 48px rgba(0, 255, 209, 0.2)'
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-in'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 209, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 209, 0.8)' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
}

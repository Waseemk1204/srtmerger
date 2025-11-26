export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'typewriter-cursor': 'typewriter 3s steps(40) 1s 1 normal both, blink-caret 0.75s 5 step-end forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'drop-in': 'drop-in 0.5s ease-out forwards',
        'swap-left': 'swap-left 2s ease-in-out infinite',
        'swap-right': 'swap-right 2s ease-in-out infinite',
        'merge-slide': 'merge-slide 2s ease-in-out infinite',
        'timeline-shift': 'timeline-shift 2s ease-in-out infinite',
        'preview-scroll': 'preview-scroll 4s linear infinite',
      },
      keyframes: {
        typewriter: {
          'from': { width: '0' },
          'to': { width: '100%' }
        },
        'blink-caret': {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: '#2563eb' }
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        'drop-in': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'swap-left': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-100%)' }
        },
        'swap-right': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(100%)' }
        },
        'merge-slide': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '50%': { transform: 'translateX(50%)', opacity: '0.5' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'timeline-shift': {
          '0%': { transform: 'translateX(-20px)' },
          '50%, 100%': { transform: 'translateX(0)' }
        },
        'preview-scroll': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' }
        }
      }
    },
  },
  plugins: [],
}
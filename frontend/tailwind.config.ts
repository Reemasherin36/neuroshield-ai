import type { Config } from 'tailwindcss'

// Design tokens for NeuroShield AI: navy / teal / white with restrained cyan accents.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f1f5fb', 100: '#dde6f3', 200: '#b9cbe5', 300: '#8aa6cf', 400: '#5a7fb5',
          500: '#3c629a', 600: '#2d4c7c', 700: '#223a61', 800: '#162a4a', 900: '#0b2545', 950: '#071a33',
        },
        teal: {
          50: '#effcf9', 100: '#c8f5ee', 200: '#93e9de', 300: '#5ad6c8', 400: '#2dbbae',
          500: '#139d93', 600: '#0f8279', 700: '#0f766e', 800: '#115e59', 900: '#134e4a',
        },
        cyan: { 300: '#7ee3f5', 400: '#38d0ec', 500: '#14b8d8' },
        ink: { DEFAULT: '#0f1b2d', muted: '#4a5b73', subtle: '#5a6a80' },
        surface: { DEFAULT: '#ffffff', alt: '#f5f8fc', line: '#e2e9f2' },
        status: { warn: '#b45309', danger: '#b42318', ok: '#0f766e' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: { card: '1rem', pill: '999px' },
      boxShadow: {
        card: '0 1px 2px rgba(11,37,69,0.06), 0 8px 24px -12px rgba(11,37,69,0.14)',
        glow: '0 0 40px rgba(56,208,236,0.35)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #071a33 0%, #0b2545 35%, #0b4f5c 75%, #0e7490 100%)',
        'accent-gradient': 'linear-gradient(135deg, #0f766e 0%, #14b8d8 100%)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseNode: { '0%,100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-node': 'pulseNode 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config

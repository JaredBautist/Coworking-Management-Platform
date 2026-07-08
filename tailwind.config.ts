import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        foreground: '#1F2937',
        primary: { DEFAULT: '#2563EB', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#0891B2', foreground: '#FFFFFF' },
        accent: { DEFAULT: '#7C3AED', foreground: '#FFFFFF' },
        destructive: { DEFAULT: '#DC2626', foreground: '#FFFFFF' },
        background: '#FAFBFC',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        muted: { DEFAULT: '#F3F4F6', foreground: '#6B7280' },
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.06)',
        card: '0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)',
        elevated: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

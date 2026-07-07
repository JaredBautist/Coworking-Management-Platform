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
        primary: { DEFAULT: '#4F46E5', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#0EA5E9', foreground: '#FFFFFF' },
        accent: { DEFAULT: '#F59E0B', foreground: '#1C1917' },
        destructive: { DEFAULT: '#EF4444', foreground: '#FFFFFF' },
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        muted: { DEFAULT: '#F1F5F9', foreground: '#64748B' },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

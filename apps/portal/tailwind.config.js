/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #1B4FD8)',
        'primary-hover': '#1D4ED8',
        secondary: 'var(--color-secondary, #F59E0B)',
        bg: '#0F172A',
        'surface-elevated': '#1E293B',
        'surface-card': '#334155',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        'belt-white': '#F8FAFC',
        'belt-blue': '#3B82F6',
        'belt-purple': '#A855F7',
        'belt-brown': '#92400E',
        'belt-black': '#1F2937',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

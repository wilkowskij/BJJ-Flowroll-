/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1B4FD8',
        secondary: '#F59E0B',
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
    },
  },
  plugins: [],
};

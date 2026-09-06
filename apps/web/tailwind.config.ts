import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tvs: {
          blue: '#1F4E8C',
          'blue-dark': '#173D70',
          'blue-light': '#EBF2FC',
          green: '#0B9348',
          'green-dark': '#08783B',
          'green-light': '#E8F6EE',
          surface: '#FFFFFF',
          'surface-soft': '#F7F9F8',
          'surface-muted': '#F1F4F3',
          border: '#DDE3E0',
          'text-primary': '#222222',
          'text-secondary': '#5F6368',
          'text-muted': '#858585',
          warning: '#D97706',
          'warning-light': '#FEF3C7',
          danger: '#DC2626',
          'danger-light': '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};

export default config;

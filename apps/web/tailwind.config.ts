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
          bg: '#0F1113',
          surface: '#171A1D',
          'surface-secondary': '#1D2125',
          'surface-elevated': '#24292E',
          border: '#2B3035',
          'border-subtle': '#22272B',
          'text-primary': '#F3F5F4',
          'text-secondary': '#A7AFB5',
          'text-muted': '#737C83',
          blue: '#3D78C2',
          'blue-dark': '#2A5A96',
          'blue-light': '#1A283B',
          green: '#16A05A',
          'green-dark': '#08783B',
          'green-light': '#132E20',
          warning: '#D89A24',
          'warning-light': '#332511',
          danger: '#D65353',
          'danger-light': '#381818',
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

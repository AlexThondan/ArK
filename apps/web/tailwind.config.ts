import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15, 23, 42, 0.12)'
      },
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d7f0ff',
          500: '#0ea5e9',
          700: '#0369a1',
          900: '#0c4a6e'
        }
      }
    }
  },
  plugins: []
};

export default config;


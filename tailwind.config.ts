import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        panel: '#111827',
        card: '#1f2937',
        edge: '#60a5fa',
      },
    },
  },
  plugins: [],
};

export default config;

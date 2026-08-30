import type { Config } from 'tailwindcss';

const config: Config = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#444cf7',
          hover: '#3339c4',
        },
      },
      fontFamily: {
        sans: [
          'HealTheWebA',
          'HealTheWebA-Regular',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        montserrat: ['Montserrat-ExtraBold', 'MontserratExtraBold', 'sans-serif'],
        'heal-a': ['HealTheWebA', 'HealTheWebA-Regular', 'sans-serif'],
        'heal-b': ['HealTheWebB', 'HealTheWebB-Regular', 'sans-serif'],
        impact: ['Impact', 'Impact', 'fantasy', 'sans-serif'],
        marykate: ['MarykateRegular-French', 'MarykateRegular', 'cursive', 'sans-serif'],
        helvetica: ['HelveticaNeue', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

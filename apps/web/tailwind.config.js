/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ethiopia: {
          green: '#009639',
          yellow: '#FED100',
          red: '#EF3340',
          dark: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};

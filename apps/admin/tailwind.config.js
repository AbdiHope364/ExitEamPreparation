/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          900: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};

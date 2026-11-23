/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a1f36',
          50: '#f0f1f7',
          100: '#d0d3e8',
          500: '#3d4777',
          900: '#1a1f36',
        },
        secondary: {
          DEFAULT: '#FF6B35',
          500: '#FF6B35',
          600: '#e55a24',
        },
        accent: {
          DEFAULT: '#FFB347',
          500: '#FFB347',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        surface: '#FFFFFF',
        cobalt: '#1A45E5',
        ink: '#111827',
        profit: {
          bg: '#ECFCCB',
          accent: '#A3E635',
          text: '#365314',
        },
        loss: {
          bg: '#FFE4E6',
          accent: '#F25C54',
          text: '#881337',
        },
        pastel: {
          lavender: '#DDD6FE',
          yellow: '#FDE047',
          coral: '#F25C54',
          blue: '#DBEAFE',
          green: '#D9F99D',
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        hand: ['"Caveat"', 'cursive'],
      },
      boxShadow: {
        editorial: '0 4px 20px -2px rgba(17, 24, 39, 0.06), 0 2px 6px -1px rgba(17, 24, 39, 0.04)',
        card: '0 10px 30px -5px rgba(17, 24, 39, 0.05)',
      },
    },
  },
  plugins: [],
};

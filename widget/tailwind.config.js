/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary_color)',
        secondary: 'var(--secondary_color)',
        accent: 'var(--accent_color)',
        whites: 'var(--whites_color)',      
      }
    },
  },
  plugins: [],
};

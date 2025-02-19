// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ['./src/**/*.{html,ts}'],
//   theme: {
//     extend: {
//       animation: {
//         fadeInScale: "fadeInScale .5s ease forwards",
//         fadeOutScale: "fadeOutScale .5s ease forwards",
//       },
//       keyframes: {
//         fadeInScale: {
//           "0%": { opacity: "0", transform: "scale(0)" },
//           "100%": { opacity: "1", transform: "scale(1)" },
//         },
//         fadeOutScale: {
//           "0%": { opacity: "1", transform: "scale(1)" },
//           "100%": { opacity: "0", transform: "scale(0)" },
//         },
//       },
//       transitionTimingFunction: {
//         'in-out-custom': 'cubic-bezier(0.4, 0, 0.2, 1)',
//       },
//       transitionDuration: {
//         'fast': '150ms',
//         'slow': '500ms',
//       },
//       colors: {
//         primary: 'var(--primary-color)',
//         secondary: 'var(--secondary-color)',
//         accent: 'var(--accent-color)',
//         whites: 'var(--whites-color)',
//       },
//     },
//   },
//   plugins: [],
// };



/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      animation: {
        fadeInScale: "fadeInScale 1s ease forwards",
        fadeOutScale: "fadeOutScale .1s ease forwards",
      },
      keyframes: {
        fadeInScale: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOutScale: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      transitionTimingFunction: {
        'in-out-custom': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'slow': '500ms',
      },
      colors: {
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        accent: 'var(--accent-color)',
        whites: 'var(--whites-color)',
      },
    },
  },
  plugins: [],
};

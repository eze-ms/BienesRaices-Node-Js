/** @type {import('tailwindcss').Config} */
module.exports = {
  // mode: 'jit', // JIT mode para compilación más eficiente
  content: ['./views/**/*.pug'],
  theme: {
    extend: {
      colors: {
        customPink: '#B62682',
        customPinkHover:'#8c1d64',
      },
    },
  },
  plugins: [],
}
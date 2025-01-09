/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"],
  theme: {
    extend: {fontFamily: {
      jaro: ['Jaro', 'sans-serif'],
      roboto: ['Roboto', 'sans-serif'],},
  },
},
  plugins: [],
}


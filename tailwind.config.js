/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"], // Scanne les fichiers .ejs
  theme: {
    extend: {
      fontFamily: {
        jaro: ["Jaro", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
      },
    },
  },
  safelist: [
    'notification', 
    'opacity-0', 
    'invisible', 
    'opacity-100', 
    'visible'
  ],
  plugins: [],
};
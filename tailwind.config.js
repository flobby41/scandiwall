/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"], // Ser till att Tailwind scannar dina .ejs-filer
  theme: {
    extend: {
      fontFamily: {
        jaro: ["Jaro", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

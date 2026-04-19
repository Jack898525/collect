/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: '#3B82F6', // 大学蓝
        secondary: '#10B981', // 青绿色
      }
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: { extend: {
    colors: { ink: "#17172b", violet: "#6d5ce8", canvas: "#f6f7fb" },
    boxShadow: { soft: "0 8px 30px rgba(27, 31, 59, 0.06)" }
  }},
  plugins: [],
};

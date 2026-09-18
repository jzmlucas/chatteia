/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        twitch: {
          purple: "#9146FF",
          dark: "#0e0e10",
          panel: "#18181b",
          border: "#26262c",
        },
      },
    },
  },
  plugins: [],
};

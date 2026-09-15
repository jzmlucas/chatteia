export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "twitch-purple": "#9146FF",
        "twitch-panel": "#18181B",
        "twitch-dark": "#0E0E10",
        "twitch-border": "#2F2F35",
      },
    },
  },
  plugins: [],
};
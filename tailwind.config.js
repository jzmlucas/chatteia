export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta baseada na logo do Chatteia (papagaio rosa/vermelho/amarelo).
        brand: {
          50: "#fef1f5",
          100: "#fde3ec",
          200: "#fbc0d4",
          300: "#f994b5",
          400: "#f76f9c",
          500: "#F55376", // rosa principal da logo
          600: "#e33361",
          700: "#c22450",
          800: "#9c1b40",
          900: "#7d1734",
        },
        "brand-red": "#EB0000",
        "brand-yellow": "#F5BC00",
        "brand-orange": "#EB7900",
        // Mantidos por compatibilidade com código antigo, agora
        // apontando para a nova identidade visual (não mais roxo).
        "twitch-purple": "#F55376",
        "twitch-panel": "#18181B",
        "twitch-dark": "#0E0E10",
        "twitch-border": "#2F2F35",
      },
    },
  },
  plugins: [],
};
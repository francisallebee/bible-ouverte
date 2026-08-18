import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    // `src/lib` porte désormais des noms de classes — la table des couleurs
    // de statut de ticket vit dans `src/lib/tickets.ts`. Sans cette ligne,
    // Tailwind ne les voit pas et les purge : les badges perdent leur
    // couleur, et en mode sombre le texte devient invisible sur son fond
    // clair. Constaté le 18 août 2026, après le déplacement de la table.
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;

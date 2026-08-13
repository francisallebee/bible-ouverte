import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Reprend l'alias @/* de tsconfig.json plutôt que de le redéclarer ici.
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    // Les fonctions Edge tournent sous Deno, mais leur logique pure — qui doit
    // recevoir quoi et quand — se teste ici comme le reste plutôt qu'en
    // production, où il faudrait attendre le lendemain pour la voir échouer.
    include: ['src/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
  },
});

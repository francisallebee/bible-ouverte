import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Reprend l'alias @/* de tsconfig.json plutôt que de le redéclarer ici.
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

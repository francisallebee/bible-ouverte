import { readFileSync } from 'node:fs';

// package.json est la seule source du numéro de version. `env` l'inline à la
// compilation, ce qui le rend lisible depuis les composants client sans
// embarquer le reste du fichier (dont la liste des dépendances) dans le bundle.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
};

export default nextConfig;

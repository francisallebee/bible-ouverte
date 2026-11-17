#!/usr/bin/env node
/**
 * Ajoute les 13 vidéos de la série dans les brouillons Ghost importés.
 *
 * À lancer SUR VOTRE ORDINATEUR, avec Node 18 ou plus récent, sans aucune dépendance :
 *
 *   GHOST_URL=https://blog.oappliday.tech \
 *   GHOST_ADMIN_KEY=<id>:<secret> \
 *   node ajouter-videos-ghost.mjs
 *
 * La clé vient de Ghost Admin → Settings → Integrations → « Add custom integration »
 * → « Admin API key ». Elle ne quitte pas votre ordinateur : le script s'en sert pour
 * signer ses requêtes, puis vous pouvez supprimer l'intégration.
 *
 * Pour chaque brouillon :
 *   1. envoie la vidéo et son image d'aperçu dans la médiathèque de Ghost ;
 *   2. remplace le paragraphe « 🎬 Vidéo à insérer ici » par une carte Vidéo.
 * Un brouillon qui n'a plus ce paragraphe est laissé tel quel : relancer le script
 * ne crée pas de doublon. Rien n'est publié — les articles restent des brouillons.
 *
 * Fichiers attendus : les MP4 dans ./videos (ou ../livrables dans le dépôt),
 * les aperçus JPG dans ./apercus.
 */
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const URL_BLOG = (process.env.GHOST_URL || 'https://blog.oappliday.tech').replace(/\/$/, '');
const CLE = process.env.GHOST_ADMIN_KEY || '';
const ESSAI = process.argv.includes('--essai'); // ne modifie rien, montre ce qui serait fait

const EPISODES = [
  ['pourquoi-bible-ouverte', '01-pourquoi-bible-ouverte', 56.43],
  ['premiere-lecture-bible-ouverte', '02-premiere-lecture', 54.72],
  ['plans-de-lecture-bible-ouverte', '03-plans-a-plusieurs', 51.6],
  ['recherche-bible-ouverte', '04-recherche', 46.8],
  ['hebreu-grec-bible-ouverte', '05-hebreu-grec', 45.73],
  ['progression-bible-ouverte', '06-progression', 41.04],
  ['verset-du-jour-bible-ouverte', '07-verset-du-jour', 39.8],
  ['quiz-bible-ouverte', '08-quiz', 39.68],
  ['memorisation-bible-ouverte', '09-memorisation', 43.94],
  ['statistiques-bible-ouverte', '10-statistiques', 35.07],
  ['historique-bible-ouverte', '11-historique', 41.57],
  ['ta-voix-bible-ouverte', '12-ta-voix', 39.04],
  ['reglages-bible-ouverte', '13-reglages', 45.14],
];
const REPERE = 'Vidéo à insérer ici';

if (!/^[0-9a-f]+:[0-9a-f]+$/i.test(CLE)) {
  console.error('GHOST_ADMIN_KEY manquante ou mal formée (attendu : <id>:<secret>, copiée depuis Ghost → Integrations).');
  process.exit(1);
}

const dossierVideos = [join(ICI, 'videos'), join(ICI, '..', 'livrables')].find((d) => existsSync(d));
const dossierApercus = join(ICI, 'apercus');
if (!dossierVideos) {
  console.error('Dossier des vidéos introuvable : placez les MP4 dans ./videos à côté du script.');
  process.exit(1);
}

/** Jeton d'administration Ghost : JWT HS256 valable 5 minutes, signé avec la clé. */
function jeton() {
  const [id, secret] = CLE.split(':');
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const maintenant = Math.floor(Date.now() / 1000);
  const corps = `${b64({ alg: 'HS256', typ: 'JWT', kid: id })}.${b64({ iat: maintenant, exp: maintenant + 300, aud: '/admin/' })}`;
  const signature = createHmac('sha256', Buffer.from(secret, 'hex')).update(corps).digest('base64url');
  return `${corps}.${signature}`;
}

async function api(chemin, options = {}) {
  const reponse = await fetch(`${URL_BLOG}/ghost/api/admin${chemin}`, {
    ...options,
    headers: { Authorization: `Ghost ${jeton()}`, 'Accept-Version': 'v6.0', ...(options.headers || {}) },
  });
  const texte = await reponse.text();
  if (!reponse.ok) throw new Error(`${options.method || 'GET'} ${chemin} → ${reponse.status} ${texte.slice(0, 300)}`);
  return texte ? JSON.parse(texte) : {};
}

async function envoyerVideo(fichierVideo, fichierApercu) {
  const form = new FormData();
  form.append('file', new Blob([readFileSync(fichierVideo)], { type: 'video/mp4' }), basename(fichierVideo));
  if (existsSync(fichierApercu)) {
    form.append('thumbnail', new Blob([readFileSync(fichierApercu)], { type: 'image/jpeg' }), basename(fichierApercu));
  }
  const { media } = await api('/media/upload/', { method: 'POST', body: form });
  return media[0];
}

/** Le texte d'un nœud Lexical, enfants compris. */
const texteDe = (n) => (n.text || '') + (n.children || []).map(texteDe).join('');

let faits = 0;
for (const [slug, nom, duree] of EPISODES) {
  let post;
  try {
    ({ posts: [post] } = await api(`/posts/slug/${slug}/?formats=lexical`));
  } catch (e) {
    console.log(`✗ ${slug} : brouillon introuvable (${e.message.split('→')[1]?.trim().slice(0, 60) || e.message})`);
    continue;
  }
  const lexical = JSON.parse(post.lexical);
  const i = lexical.root.children.findIndex((n) => texteDe(n).includes(REPERE));
  if (i === -1) {
    console.log(`= ${slug} : déjà fait (plus de paragraphe « ${REPERE} »)`);
    continue;
  }
  if (ESSAI) {
    console.log(`→ ${slug} : recevrait ${nom}.mp4`);
    continue;
  }
  const media = await envoyerVideo(join(dossierVideos, `${nom}.mp4`), join(dossierApercus, `${nom}.jpg`));
  lexical.root.children[i] = {
    type: 'video',
    version: 1,
    src: media.url,
    caption: '',
    fileName: `${nom}.mp4`,
    mimeType: 'video/mp4',
    width: 1080,
    height: 1920,
    duration: duree,
    thumbnailSrc: media.thumbnail_url || '',
    customThumbnailSrc: '',
    thumbnailWidth: 1080,
    thumbnailHeight: 1920,
    cardWidth: 'regular',
    loop: false,
  };
  await api(`/posts/${post.id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts: [{ lexical: JSON.stringify(lexical), updated_at: post.updated_at }] }),
  });
  faits++;
  console.log(`✓ ${slug} : ${nom}.mp4 ajoutée (statut : ${post.status})`);
}
console.log(`\n${faits} vidéo(s) ajoutée(s). Les articles restent des brouillons.`);

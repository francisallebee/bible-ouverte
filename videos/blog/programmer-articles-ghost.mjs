#!/usr/bin/env node
/**
 * Programme la publication des 13 articles de la série : un par jour, à midi (heure de
 * Paris), du 18 au 30 novembre 2026, de l'épisode 1 à l'épisode 13.
 *
 * À lancer SUR VOTRE ORDINATEUR (Node 18+), dans le dossier du kit, avec la même clé
 * d'intégration que pour les vidéos :
 *
 *   GHOST_ADMIN_KEY='<id>:<secret>' node programmer-articles-ghost.mjs --essai
 *   GHOST_ADMIN_KEY='<id>:<secret>' node programmer-articles-ghost.mjs
 *
 * --essai ne modifie rien. Chaque brouillon passe au statut « Programmé » (scheduled) :
 * Ghost le publiera tout seul à la date indiquée. Aucune infolettre n'est envoyée.
 * Un article encore marqué « Vidéo à insérer ici » est refusé : lancez d'abord
 * ajouter-videos-ghost.mjs. Relancer le script remet simplement les mêmes dates.
 */
import { createHmac } from 'node:crypto';

const URL_BLOG = (process.env.GHOST_URL || 'https://blog.oappliday.tech').replace(/\/$/, '');
const CLE = process.env.GHOST_ADMIN_KEY || '';
const ESSAI = process.argv.includes('--essai');

// Midi à Paris en novembre = 11:00 UTC (heure d'hiver, UTC+1).
const PREMIER_JOUR = Date.UTC(2026, 10, 18, 11, 0, 0);
const SLUGS = [
  'pourquoi-bible-ouverte', 'premiere-lecture-bible-ouverte', 'plans-de-lecture-bible-ouverte',
  'recherche-bible-ouverte', 'hebreu-grec-bible-ouverte', 'progression-bible-ouverte',
  'verset-du-jour-bible-ouverte', 'quiz-bible-ouverte', 'memorisation-bible-ouverte',
  'statistiques-bible-ouverte', 'historique-bible-ouverte', 'ta-voix-bible-ouverte',
  'reglages-bible-ouverte',
];

if (!/^[0-9a-f]+:[0-9a-f]+$/i.test(CLE)) {
  console.error('GHOST_ADMIN_KEY manquante ou mal formée (attendu : <id>:<secret>, copiée depuis Ghost → Integrations).');
  process.exit(1);
}

function jeton() {
  const [id, secret] = CLE.split(':');
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const t = Math.floor(Date.now() / 1000);
  const corps = `${b64({ alg: 'HS256', typ: 'JWT', kid: id })}.${b64({ iat: t, exp: t + 300, aud: '/admin/' })}`;
  return `${corps}.${createHmac('sha256', Buffer.from(secret, 'hex')).update(corps).digest('base64url')}`;
}

async function api(chemin, options = {}) {
  const r = await fetch(`${URL_BLOG}/ghost/api/admin${chemin}`, {
    ...options,
    headers: { Authorization: `Ghost ${jeton()}`, 'Accept-Version': 'v6.0', 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const texte = await r.text();
  if (!r.ok) throw new Error(`${options.method || 'GET'} ${chemin} → ${r.status} ${texte.slice(0, 300)}`);
  return texte ? JSON.parse(texte) : {};
}

const date = (ms) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(ms);

let faits = 0;
for (const [i, slug] of SLUGS.entries()) {
  const quand = PREMIER_JOUR + i * 86400000;
  let post;
  try {
    ({ posts: [post] } = await api(`/posts/slug/${slug}/?formats=lexical`));
  } catch (e) {
    console.log(`✗ ${slug} : introuvable (${e.message.slice(0, 80)})`);
    continue;
  }
  if (post.status === 'published') {
    console.log(`= ${slug} : déjà publié, laissé tel quel`);
    continue;
  }
  if ((post.lexical || '').includes('Vidéo à insérer ici')) {
    console.log(`✗ ${slug} : la vidéo n'est pas encore insérée — lancez d'abord ajouter-videos-ghost.mjs`);
    continue;
  }
  if (ESSAI) {
    console.log(`→ épisode ${i + 1} · ${slug} : ${date(quand)}`);
    continue;
  }
  await api(`/posts/${post.id}/`, {
    method: 'PUT',
    body: JSON.stringify({ posts: [{ status: 'scheduled', published_at: new Date(quand).toISOString(), updated_at: post.updated_at }] }),
  });
  faits++;
  console.log(`✓ épisode ${i + 1} · ${slug} : programmé le ${date(quand)}`);
}
console.log(`\n${faits} article(s) programmé(s).${ESSAI ? ' (essai : rien n’a été modifié)' : ''}`);

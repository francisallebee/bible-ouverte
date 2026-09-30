import { describe, it, expect } from 'vitest'
import { statSync } from 'node:fs'
import { join } from 'node:path'
import { VERSIONS } from './import'
import { LEXIQUES } from './strong'
import { ORIGINAUX } from './originaux'

/**
 * Les poids annoncés au lecteur, croisés avec les fichiers sur le disque.
 *
 * Ce test existe parce que le chiffre est **montré** depuis le 30 septembre
 * 2026 : les Réglages disent ce qu'une case va coûter avant qu'on la coche.
 * Un poids périmé est donc un mensonge à l'écran, et il n'a aucun symptôme
 * ailleurs — ni `tsc`, ni `eslint`, ni le téléchargement, qui réussit
 * parfaitement avec un fichier d'une autre taille.
 *
 * Le piège est réel et a déjà une histoire : `sblgnt.json` a changé de taille
 * le 30 septembre 2026, le jour même, en gagnant 71 correspondances Strong.
 * Une table figée dans un commentaire aurait survécu à la régénération sans
 * que rien ne le signale.
 *
 * La tolérance est nulle à dessein. Un octet d'écart veut dire que le fichier
 * a été refait ; relever la nouvelle valeur coûte une commande, et l'arrondir
 * ferait perdre le seul repère qui dit que les deux sont bien le même fichier.
 */
const racine = join(__dirname, '..', '..', '..', 'public')

const tout = [
  ...VERSIONS.map((v) => ({ quoi: v.id, chemin: join(racine, 'bibles', v.file), octets: v.octets })),
  ...LEXIQUES.map((l) => ({ quoi: l.id, chemin: join(racine, 'strong', l.file), octets: l.octets })),
  ...ORIGINAUX.map((o) => ({ quoi: o.langue, chemin: join(racine, 'originaux', o.file), octets: o.octets })),
]

describe('les poids annoncés', () => {
  it('correspondent à la taille réelle de chaque fichier servi', () => {
    const faux = tout
      .map((f) => ({ ...f, reel: statSync(f.chemin).size }))
      .filter((f) => f.reel !== f.octets)
      .map((f) => `${f.quoi} : annoncé ${f.octets}, réel ${f.reel}`)

    expect(faux, 'poids annoncés périmés').toEqual([])
  })

  it('ne laisse aucun poids à zéro ni négatif', () => {
    // Un zéro passerait le test précédent sur un fichier absent si `statSync`
    // changeait de comportement, et se lirait « 0 o » à l'écran.
    const absurdes = tout.filter((f) => !(f.octets > 0)).map((f) => f.quoi)
    expect(absurdes, 'poids nuls ou négatifs').toEqual([])
  })
})

'use client'

import { HardDrive, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { formaterOctets, niveauOccupation, type Occupation } from '@/lib/storage/occupation'

/**
 * Ce que le cache occupe, dit au lecteur au moment où il choisit ses textes.
 *
 * Rien ne l'avertissait jusqu'au 30 septembre 2026. Il pouvait cocher douze
 * traductions, deux lexiques et deux textes originaux — 115,7 Mio — sans
 * qu'aucun écran ne lui dise ce qu'il occupait ni ce qui l'attendait.
 *
 * **Deux chiffres et non un**, et ils ne s'additionnent pas : ce que le
 * navigateur mesure (`navigator.storage.estimate`, toute l'origine) et ce que
 * les cases cochées pèsent au téléchargement. Le premier est un peu plus grand
 * que le second — il compte aussi les lectures, les contextes, le service
 * worker —, et les confondre ferait passer l'écart pour une erreur.
 *
 * **Aucune couleur neuve.** Le texte reste `--text` sur `--*-light`, couple sûr
 * dans les deux modes par construction : `--warning-light` est presque blanc en
 * clair et presque noir en sombre, quand `--text` fait l'inverse. La règle 15
 * punit les classes Tailwind grises ajoutées sans remap ; ici il n'y en a
 * aucune. La barre emprunte `--piste`, déjà remappée pour les progressions.
 */

interface Props {
  /** La mesure du navigateur, ou `null` s'il ne la donne pas. */
  occupation: Occupation | null
  /** Le poids annoncé de ce qui est coché. */
  poidsChoisi: number
  className?: string
}

export default function OccupationCache({ occupation, poidsChoisi, className = '' }: Props) {
  const { t, locale } = useI18n()
  const niveau = niveauOccupation(occupation)
  const s = t.settings.stockage

  const part = occupation?.quota ? Math.min(1, occupation.utilise / occupation.quota) : null

  return (
    <div className={`rounded-lg border border-[--border] bg-[--surface] px-3.5 py-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <HardDrive className="w-4 h-4 text-[--text-secondary] shrink-0" />
        <span className="text-sm font-medium text-[--text]">{s.titre}</span>
      </div>

      {occupation ? (
        <>
          <p className="text-sm text-[--text]">
            {occupation.quota !== null && part !== null
              ? s.utiliseSurQuota(
                  formaterOctets(locale, occupation.utilise, s.unites),
                  formaterOctets(locale, occupation.quota, s.unites),
                  /*
                    Une décimale sous les 10 %, aucune au-delà. Sans cela,
                    0,59 % s'affichait « 1 % » — vu à l'écran le 30 septembre
                    2026 —, ce qui gonfle presque du double le seul chiffre
                    censé rassurer. Au-delà de 10 %, la décimale n'apprend rien
                    et fait du bruit.
                  */
                  new Intl.NumberFormat(locale, {
                    style: 'percent',
                    maximumFractionDigits: part < 0.1 ? 1 : 0,
                  }).format(part),
                )
              : s.utilise(formaterOctets(locale, occupation.utilise, s.unites))}
          </p>

          {/*
            La barre ne paraît que si le quota est connu : sans dénominateur,
            un remplissage serait une invention. C'est le cas de Safari avant
            la 17, et de la navigation privée, où `estimate()` refuse.
          */}
          {part !== null && (
            <div
              className="h-2 rounded-full bg-[--piste] overflow-hidden mt-2"
              role="progressbar"
              aria-valuenow={Math.round(part * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={s.titre}
            >
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${Math.max(1, part * 100)}%`,
                  /*
                    `--alerte-*` et non `--warning` / `--danger` : ces deux
                    dernières sont faites pour teinter un fond et ne tiennent
                    que 1,99 sur `--piste` en mode clair, sous le 3:1 des
                    éléments non textuels. Mesuré, pas supposé.
                  */
                  backgroundColor:
                    niveau === 'critique' ? 'var(--alerte-danger)'
                    : niveau === 'attention' ? 'var(--alerte-attention)'
                    : 'var(--primary)',
                }}
              />
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-[--text-secondary]">{s.inconnu}</p>
      )}

      <p className="text-xs text-[--text-secondary] mt-2">
        {s.choisi(formaterOctets(locale, poidsChoisi, s.unites))}
      </p>

      {niveau !== 'ok' && (
        <div
          role="alert"
          className={`flex items-start gap-2 mt-2.5 rounded-lg px-3 py-2 text-sm text-[--text] ${
            niveau === 'critique'
              ? 'bg-[--danger-light] border border-[--alerte-danger]'
              : 'bg-[--warning-light] border border-[--alerte-attention]'
          }`}
        >
          <AlertTriangle
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              niveau === 'critique' ? 'text-[--alerte-danger]' : 'text-[--alerte-attention]'
            }`}
          />
          <span>{niveau === 'critique' ? s.critique : s.attention}</span>
        </div>
      )}

      {/*
        La dette du 16 août 2026, dite plutôt que cachée : les lignes sont bien
        supprimées mais le navigateur ne rend les octets qu'à sa prochaine
        compaction, qu'on ne peut ni déclencher ni observer. Promettre un gain
        immédiat ferait revenir le lecteur constater que le chiffre n'a pas
        bougé.
      */}
      <p className="text-xs text-[--text-secondary] mt-2">{s.differe}</p>
    </div>
  )
}

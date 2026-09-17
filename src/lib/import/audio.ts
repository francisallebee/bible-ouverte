import type { Locale } from '@/lib/i18n/locales'

/**
 * Le texte d'un fichier audio, transcrit **sur l'appareil**.
 *
 * Décision du propriétaire du 17 septembre 2026 : l'audio est un fichier
 * qu'on importe — la dictée vocale est celle de l'appareil, pas la nôtre —,
 * et il n'y a pas de modèle payant. Il reste donc un modèle de parole **sur
 * l'appareil**, comme Tesseract pour la photo : Whisper « tiny »
 * (`onnx-community/whisper-tiny`, ~40 Mo téléchargés une fois, gardés par le
 * navigateur), cinq langues, par `transformers.js`.
 *
 * **Aucune dépendance npm.** `@huggingface/transformers` tire `sharp` et
 * `onnxruntime-node`, deux binaires natifs pour Node dont le navigateur n'a
 * pas besoin ; la bibliothèque est chargée **depuis jsDelivr à la demande**,
 * version épinglée — ce que `tesseract.js` fait déjà pour son moteur.
 * `webpackIgnore` dit à webpack de laisser cet `import()` au navigateur.
 *
 * Mono-fil et sans worker : `onnxruntime-web` voudrait des workers, qu'une
 * origine tierce ne peut pas créer sans détours. Plus lent, mais sûr.
 *
 * Ce que ça vaut, à dire au lecteur : honnête sur une voix claire et proche,
 * médiocre sur un culte enregistré de loin, et plus lent que le réel sur un
 * téléphone. Le fichier ne quitte pas l'appareil.
 */

/** Le nom de langue que Whisper attend, par langue de l'interface. */
const LANGUES_WHISPER: Record<Locale, string> = {
  fr: 'french',
  en: 'english',
  es: 'spanish',
  it: 'italian',
  ar: 'arabic',
}

export function langueWhisper(locale: Locale): string {
  return LANGUES_WHISPER[locale]
}

/** Whisper n'entend qu'à 16 kHz, en mono. */
export const FREQUENCE_WHISPER = 16_000

/** Au-delà, le téléphone n'a plus la mémoire : le lecteur coupera son enregistrement. */
export const DUREE_MAXIMALE_S = 30 * 60

export type ProgressionAudio =
  | { etape: 'decodage' }
  | { etape: 'modele'; part: number }
  | { etape: 'transcription' }

/** Un mélange en mono, par moyenne des canaux. Pure, testée. */
export function versMono(canaux: Float32Array[]): Float32Array {
  if (canaux.length === 0) return new Float32Array(0)
  if (canaux.length === 1) return canaux[0]
  const longueur = canaux[0].length
  const sortie = new Float32Array(longueur)
  for (let i = 0; i < longueur; i++) {
    let somme = 0
    for (const c of canaux) somme += c[i] ?? 0
    sortie[i] = somme / canaux.length
  }
  return sortie
}

const VERSION_TRANSFORMERS = '4.3.0'
const MODELE = 'onnx-community/whisper-tiny'

interface Transcripteur {
  (audio: Float32Array, options: Record<string, unknown>): Promise<{ text: string }>
}
interface Transformers {
  env: { allowLocalModels: boolean; backends: { onnx: { wasm: { numThreads: number; proxy: boolean } } } }
  pipeline(tache: string, modele: string, options: Record<string, unknown>): Promise<Transcripteur>
}

let transcripteur: Promise<Transcripteur> | null = null

async function chargerTranscripteur(onProgression?: (p: ProgressionAudio) => void): Promise<Transcripteur> {
  if (transcripteur) return transcripteur
  transcripteur = (async () => {
    const url = `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${VERSION_TRANSFORMERS}/dist/transformers.min.js`
    const lib = (await import(/* webpackIgnore: true */ url)) as Transformers
    lib.env.allowLocalModels = false
    lib.env.backends.onnx.wasm.numThreads = 1
    lib.env.backends.onnx.wasm.proxy = false
    const total = new Map<string, { loaded: number; total: number }>()
    return lib.pipeline('automatic-speech-recognition', MODELE, {
      dtype: 'q8',
      progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
        if (p.status === 'progress' && p.file && p.total) {
          total.set(p.file, { loaded: p.loaded ?? 0, total: p.total })
          let l = 0, t = 0
          for (const v of Array.from(total.values())) { l += v.loaded; t += v.total }
          onProgression?.({ etape: 'modele', part: t ? l / t : 0 })
        }
      },
    })
  })()
  try {
    return await transcripteur
  } catch (e) {
    transcripteur = null
    throw e
  }
}

/**
 * Décode le fichier avec le navigateur — tout format qu'il sait lire —, puis
 * le rééchantillonne à 16 kHz en mono par un contexte hors ligne.
 */
async function echantillonsDe(fichier: File): Promise<Float32Array> {
  const contexte = new AudioContext()
  let decode: AudioBuffer
  try {
    decode = await contexte.decodeAudioData(await fichier.arrayBuffer())
  } finally {
    await contexte.close()
  }
  if (decode.duration > DUREE_MAXIMALE_S) throw new Error('trop-long')
  const longueur = Math.ceil(decode.duration * FREQUENCE_WHISPER)
  const horsLigne = new OfflineAudioContext(1, longueur, FREQUENCE_WHISPER)
  const source = horsLigne.createBufferSource()
  source.buffer = decode
  source.connect(horsLigne.destination)
  source.start()
  const rendu = await horsLigne.startRendering()
  return versMono(Array.from({ length: rendu.numberOfChannels }, (_, i) => rendu.getChannelData(i)))
}

export async function transcrire(
  fichier: File,
  locale: Locale,
  onProgression?: (p: ProgressionAudio) => void,
): Promise<string> {
  onProgression?.({ etape: 'decodage' })
  const echantillons = await echantillonsDe(fichier)
  const modele = await chargerTranscripteur(onProgression)
  onProgression?.({ etape: 'transcription' })
  const { text } = await modele(echantillons, {
    language: langueWhisper(locale),
    task: 'transcribe',
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: false,
  })
  // Un silence, ou un son qui n'est pas une voix, ressort en « ... » : sans
  // une lettre ni un chiffre, il n'y a pas eu de parole.
  return new RegExp('[\\p{L}\\p{N}]', 'u').test(text) ? text.trim() : ''
}

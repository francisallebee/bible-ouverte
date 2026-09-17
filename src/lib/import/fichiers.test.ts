import { describe, it, expect, vi } from 'vitest'
import { deflateRawSync } from 'node:zlib'
import { texteDuFichier, TAILLE_MAXIMALE } from './fichiers'

// `pdf.js` a besoin d'un navigateur ; ici on vérifie seulement que le PDF lui
// est confié, avec la langue et le rapporteur de progression.
vi.mock('./pdf', () => ({
  texteDuPdf: vi.fn(async (f: File, locale: string) => `pdf:${f.name}:${locale}`),
}))
// Whisper aussi : ici, seulement l'aiguillage, la parole vide et la durée.
vi.mock('./audio', () => ({
  transcrire: vi.fn(async (f: File, locale: string) => {
    if (f.name.startsWith('silence')) return ''
    if (f.name.startsWith('long')) throw new Error('trop-long')
    return `audio:${f.name}:${locale}`
  }),
}))

/**
 * Un écrivain zip minimal, pour fabriquer des fixtures Word, Excel et
 * OpenDocument sans en committer un seul octet binaire. Il écrit ce que le
 * lecteur lit — méthode 8 (deflate) ou 0 — et rien d'autre ; un vrai fichier
 * de bureau porte en plus des CRC et des dates que le lecteur ignore.
 */
function zip(entrees: Record<string, string>, methode: 0 | 8 = 8): Uint8Array {
  const parties: Uint8Array[] = []
  const centrales: Uint8Array[] = []
  let decalage = 0
  const u16 = (n: number) => [n & 0xff, (n >> 8) & 0xff]
  const u32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]
  for (const [nom, contenu] of Object.entries(entrees)) {
    const nomOctets = new TextEncoder().encode(nom)
    const brut = new TextEncoder().encode(contenu)
    const donnees = methode === 8 ? new Uint8Array(deflateRawSync(brut)) : brut
    const locale = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(methode), ...u16(0), ...u16(0), ...u32(0),
      ...u32(donnees.length), ...u32(brut.length), ...u16(nomOctets.length), ...u16(0),
      ...Array.from(nomOctets),
    ])
    parties.push(locale, donnees)
    centrales.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(methode), ...u16(0), ...u16(0), ...u32(0),
      ...u32(donnees.length), ...u32(brut.length), ...u16(nomOctets.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(decalage), ...Array.from(nomOctets),
    ]))
    decalage += locale.length + donnees.length
  }
  const tailleCentrale = centrales.reduce((s, c) => s + c.length, 0)
  const fin = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(centrales.length), ...u16(centrales.length),
    ...u32(tailleCentrale), ...u32(decalage), ...u16(0),
  ])
  const total = [...parties, ...centrales, fin]
  const sortie = new Uint8Array(total.reduce((s, p) => s + p.length, 0))
  let pos = 0
  for (const p of total) { sortie.set(p, pos); pos += p.length }
  return sortie
}

// `new Uint8Array(u8)` copie dans un tampon à elle : `File` refuse une vue
// dont le tampon pourrait être partagé — le même typage que dans le lecteur.
const fichier = (nom: string, octets: Uint8Array | string, type = '') =>
  new File([typeof octets === 'string' ? new TextEncoder().encode(octets) : new Uint8Array(octets)], nom, { type })

describe('texteDuFichier — le texte brut', () => {
  it('lit un txt UTF-8 tel quel', async () => {
    expect(await texteDuFichier(fichier('notes.txt', 'Jean 3:16 — Ésaïe 53'))).toEqual({ texte: 'Jean 3:16 — Ésaïe 53' })
  })

  it('relit en windows-1252 un fichier qui n’est pas de l’UTF-8 valide', async () => {
    // « Ésaïe » en latin-1 : É = 0xC9, ï = 0xEF.
    const latin1 = new Uint8Array([0xc9, 0x73, 0x61, 0xef, 0x65, 0x20, 0x35, 0x33])
    expect(await texteDuFichier(fichier('notes.txt', latin1))).toEqual({ texte: 'Ésaïe 53' })
  })

  it('lit un csv ligne à ligne, sans y toucher', async () => {
    const r = await texteDuFichier(fichier('plan.csv', 'jour;lecture\n1;Genèse 1-3\n2;Genèse 4-7'))
    expect(r).toEqual({ texte: 'jour;lecture\n1;Genèse 1-3\n2;Genèse 4-7' })
  })

  it('un fichier de type text/* sans extension connue est du texte', async () => {
    expect(await texteDuFichier(fichier('sans-extension', 'Ps 23', 'text/plain'))).toEqual({ texte: 'Ps 23' })
  })

  it('un html perd ses balises, ses scripts, et garde ses blocs en lignes', async () => {
    const html = '<html><head><style>p{}</style><script>x=1</script></head><body><h1>Culte</h1><p>Jean&nbsp;3:16</p><p>Ps&#160;23 &amp; Ps 24</p></body></html>'
    // Le titre garde sa marque : c'est la structure qui rend la page lisible.
    expect(await texteDuFichier(fichier('culte.html', html))).toEqual({ texte: '# Culte\nJean 3:16\nPs 23 & Ps 24' })
  })
})

describe('texteDuFichier — les archives de bureau', () => {
  it('Word : les paragraphes deviennent des lignes, les tabulations restent', async () => {
    const docx = zip({
      '[Content_Types].xml': '<Types/>',
      'word/document.xml':
        '<w:document><w:body><w:p><w:r><w:t>Culte du matin</w:t></w:r></w:p>'
        + '<w:p><w:r><w:t>Romains 8:28</w:t></w:r><w:r><w:tab/><w:t>Ps&#160;23</w:t></w:r></w:p></w:body></w:document>',
    })
    expect(await texteDuFichier(fichier('culte.docx', docx))).toEqual({ texte: 'Culte du matin\nRomains 8:28\tPs 23' })
  })

  it('Word : un titre garde son niveau, une liste ses éléments, un paragraphe vide espace', async () => {
    const docx = zip({
      'word/document.xml':
        '<w:document><w:body>'
        + '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Jour 3</w:t></w:r></w:p>'
        + '<w:p><w:pPr><w:pStyle w:val="Titre2"/></w:pPr><w:r><w:t>Lecture</w:t></w:r></w:p>'
        + '<w:p><w:r><w:t>Genèse 4-7 et Ps 2.</w:t></w:r></w:p>'
        + '<w:p/>'
        + '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Relire lentement</w:t></w:r></w:p>'
        + '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Noter</w:t></w:r></w:p>'
        + '</w:body></w:document>',
    })
    expect(await texteDuFichier(fichier('plan.docx', docx))).toEqual({
      texte: '# Jour 3\n## Lecture\nGenèse 4-7 et Ps 2.\n\n- Relire lentement\n- Noter',
    })
  })

  it('HTML : h1 à h6 et li portent leur marque, trois dièses au plus', async () => {
    const html = '<h1>Un</h1><h2>Deux</h2><h4>Quatre</h4><ul><li>a</li><li>b</li></ul>'
    expect(await texteDuFichier(fichier('t.html', html))).toEqual({ texte: '# Un\n## Deux\n### Quatre\n- a\n- b' })
  })

  it('PowerPoint : le titre de la diapositive est un titre', async () => {
    const pptx = zip({
      'ppt/slides/slide1.xml': '<p:sld><p:sp><p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>Jour 1</a:t></a:r></a:p></p:txBody></p:sp>'
        + '<p:sp><p:txBody><a:p><a:r><a:t>Jean 3:16</a:t></a:r></a:p></p:txBody></p:sp></p:sld>',
    })
    expect(await texteDuFichier(fichier('c.pptx', pptx))).toEqual({ texte: '# Jour 1\nJean 3:16' })
  })

  it('Excel : chaînes partagées, chaînes en ligne et nombres, une ligne par ligne', async () => {
    const xlsx = zip({
      'xl/sharedStrings.xml': '<sst><si><t>Jour</t></si><si><t>Lecture</t></si><si><r><t>Gen</t></r><r><t>èse 1-3</t></r></si></sst>',
      'xl/worksheets/sheet1.xml':
        '<worksheet><sheetData>'
        + '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>'
        + '<row r="2"><c r="A2"><v>1</v></c><c r="B2" t="s"><v>2</v></c></row>'
        + '<row r="3"><c r="A3"><v>2</v></c><c r="B3" t="inlineStr"><is><t>Jean 3:16</t></is></c></row>'
        + '<row r="4"><c r="A4"/><c r="B4"/></row>'
        + '</sheetData></worksheet>',
    })
    expect(await texteDuFichier(fichier('plan.xlsx', xlsx))).toEqual({ texte: 'Jour\tLecture\n1\tGenèse 1-3\n2\tJean 3:16' })
  })

  it('PowerPoint : une diapositive après l’autre, dans l’ordre des numéros', async () => {
    const pptx = zip({
      'ppt/slides/slide2.xml': '<p:sld><a:p><a:r><a:t>Ps 23</a:t></a:r></a:p></p:sld>',
      'ppt/slides/slide1.xml': '<p:sld><a:p><a:r><a:t>Jean 3:16</a:t></a:r></a:p></p:sld>',
    })
    expect(await texteDuFichier(fichier('culte.pptx', pptx))).toEqual({ texte: 'Jean 3:16\n\nPs 23' })
  })

  it('OpenDocument : content.xml, paragraphes et titres en lignes', async () => {
    const odt = zip({
      'content.xml': '<office:document-content><office:text><text:h>Culte</text:h><text:p>Jean <text:span>3:16</text:span></text:p></office:text></office:document-content>',
    })
    expect(await texteDuFichier(fichier('culte.odt', odt))).toEqual({ texte: '# Culte\nJean 3:16' })
  })

  it('une archive sans compression se lit aussi', async () => {
    const docx = zip({ 'word/document.xml': '<w:p><w:t>Jude 3</w:t></w:p>' }, 0)
    expect(await texteDuFichier(fichier('a.docx', docx))).toEqual({ texte: 'Jude 3' })
  })

  it('un docx sans document.xml rend un texte vide, pas une erreur', async () => {
    expect(await texteDuFichier(fichier('vide.docx', zip({ 'a.xml': '<a/>' })))).toEqual({ texte: '' })
  })

  it('un fichier qui n’est pas une archive est illisible', async () => {
    expect(await texteDuFichier(fichier('faux.docx', 'ceci n’est pas un zip'))).toEqual({ refus: 'illisible' })
  })
})

describe('texteDuFichier — les livres numériques', () => {
  it('EPUB : les chapitres dans l’ordre de la spine, pas celui de l’archive', async () => {
    const epub = zip({
      'mimetype': 'application/epub+zip',
      'OEBPS/ch2.xhtml': '<html><body><p>Puis Ps 23.</p></body></html>',
      'OEBPS/ch1.xhtml': '<html><body><h1>Chapitre un</h1><p>Lire Jean&nbsp;3:16.</p></body></html>',
      'OEBPS/content.opf':
        '<package><manifest><item id="b" href="ch2.xhtml" media-type="application/xhtml+xml"/>'
        + '<item id="a" href="ch1.xhtml" media-type="application/xhtml+xml"/>'
        + '<item id="css" href="style.css" media-type="text/css"/></manifest>'
        + '<spine><itemref idref="a"/><itemref idref="b"/></spine></package>',
      'META-INF/container.xml': '<container><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
    })
    expect(await texteDuFichier(fichier('livre.epub', epub))).toEqual({ texte: '# Chapitre un\nLire Jean 3:16.\n\nPuis Ps 23.' })
  })

  it('EPUB sans container.xml : les XHTML triés par nom, plutôt que rien', async () => {
    const epub = zip({ 'b.xhtml': '<p>deux</p>', 'a.xhtml': '<p>un</p>' })
    expect(await texteDuFichier(fichier('brut.epub', epub))).toEqual({ texte: 'un\n\ndeux' })
  })

  it('FB2 : un XML nu, paragraphes et titres en lignes', async () => {
    const fb2 = '<FictionBook><body><title><p>Culte</p></title><section><p>Jean <emphasis>3:16</emphasis></p><empty-line/><p>Ps 23</p></section></body></FictionBook>'
    expect(await texteDuFichier(fichier('livre.fb2', fb2))).toEqual({ texte: 'Culte\nJean 3:16\n\nPs 23' })
  })

  it.each(['livre.mobi', 'livre.azw', 'livre.azw3', 'livre.kfx'])('%s : Kindle est refusé avec sa raison', async (nom) => {
    expect(await texteDuFichier(fichier(nom, new Uint8Array([0, 1, 2])))).toEqual({ refus: 'kindle-chiffre' })
  })
})

describe('texteDuFichier — les enregistrements', () => {
  it('un fichier audio est transcrit, par extension ou par type, dans la langue de l’interface', async () => {
    expect(await texteDuFichier(fichier('culte.m4a', 'x'), { locale: 'it' })).toEqual({ texte: 'audio:culte.m4a:it' })
    expect(await texteDuFichier(fichier('enregistrement', 'x', 'audio/mpeg'))).toEqual({ texte: 'audio:enregistrement:fr' })
  })
  it('un enregistrement sans parole, ou trop long, est refusé avec sa raison', async () => {
    expect(await texteDuFichier(fichier('silence.mp3', 'x'))).toEqual({ refus: 'audio-vide' })
    expect(await texteDuFichier(fichier('long.wav', 'x'))).toEqual({ refus: 'audio-trop-long' })
  })
})

describe('texteDuFichier — les refus nommés', () => {
  it('le PDF est confié à pdf.js, par extension ou par type, avec la langue', async () => {
    expect(await texteDuFichier(fichier('culte.pdf', '%PDF-1.4'), { locale: 'en' })).toEqual({ texte: 'pdf:culte.pdf:en' })
    expect(await texteDuFichier(fichier('sans-extension', '%PDF-1.4', 'application/pdf'))).toEqual({ texte: 'pdf:sans-extension:fr' })
  })

  it('un format inconnu est dit tel', async () => {
    expect(await texteDuFichier(fichier('photo.heic', new Uint8Array([0, 1, 2])))).toEqual({ refus: 'format-inconnu' })
  })

  it('un fichier au-delà de la borne est refusé avant d’être lu', async () => {
    const gros = { size: TAILLE_MAXIMALE + 1, name: 'gros.txt', type: 'text/plain' } as unknown as File
    expect(await texteDuFichier(gros)).toEqual({ refus: 'trop-gros' })
  })
})

import { describe, it, expect } from 'vitest'
import { ecrireZip } from '@/lib/import/zip-fixture'
import {
  unitesDuDocument, sectionner, filtrerCss, resoudreChemin, versDataUrl, blocsHtml, structureDesUnites, typeMimeDe, type Bloc,
} from './unites'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])
const tampon = (u8: Uint8Array) => u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer

describe('sectionner', () => {
  const B = (html: string, niveau?: number): Bloc => ({ html, texte: html.replace(/<[^>]+>/g, ''), niveau })
  it('coupe au niveau de titre utile — le plus haut qui compte deux titres — et garde le préambule', () => {
    const unites = sectionner([B('<p>Avant-propos</p>'), B('<h1>Livre</h1>', 1), B('<h2>A</h2>', 2), B('<p>a</p>'), B('<h2>B</h2>', 2), B('<p>b</p>')])
    expect(unites.map((u) => u.titre)).toEqual(['Avant-propos', 'A', 'B'])
    // Le `<h1>` seul ne fait pas d'unité : il s'accroche au chapitre qui suit.
    expect(unites[1].html).toBe('<h1>Livre</h1>\n<h2>A</h2>\n<p>a</p>')
  })
  it('un seul titre, il sert quand même ; aucun titre, des tranches de douze blocs', () => {
    expect(sectionner([B('<p>x</p>'), B('<h1>Seul</h1>', 1), B('<p>y</p>')]).map((u) => u.titre)).toEqual(['x', 'Seul'])
    const sans = sectionner(Array.from({ length: 30 }, (_, i) => B(`<p>Paragraphe ${i + 1}</p>`)))
    expect(sans).toHaveLength(3)
    expect(sans[2].titre).toBe('Paragraphe 25')
  })
})

describe('les outils', () => {
  it('filtrerCss garde la mise en page et retire police, taille, couleurs, @font-face', () => {
    const css = '@font-face{font-family:X;src:url(x.ttf)} p{margin:0 0 1em;font-family:Georgia;font-size:1.1em;color:#333;text-indent:1.5em;font-style:italic} .c{background:#fff;text-align:center}'
    const filtre = filtrerCss(css)
    expect(filtre).not.toMatch(/font-family|font-size|color|@font-face|background/)
    expect(filtre).toMatch(/margin:0 0 1em/)
    expect(filtre).toMatch(/text-indent:1.5em/)
    expect(filtre).toMatch(/font-style:italic/)
    expect(filtre).toMatch(/text-align:center/)
  })
  it('resoudreChemin remonte les `..` et retire fragment et requête', () => {
    expect(resoudreChemin('OEBPS/text/ch1.xhtml', '../images/a.png')).toBe('OEBPS/images/a.png')
    expect(resoudreChemin('OEBPS/content.opf', 'text/ch1.xhtml#p3')).toBe('OEBPS/text/ch1.xhtml')
    expect(resoudreChemin('ch1.xhtml', 'a%20b.png')).toBe('a b.png')
  })
  it('versDataUrl : le type par extension, le contenu en base64', () => {
    expect(versDataUrl(new Uint8Array([104, 105]), 'x.png')).toBe('data:image/png;base64,aGk=')
  })
  it('typeMimeDe : ce que le seau attend', () => {
    expect(typeMimeDe('a.epub')).toBe('application/epub+zip')
    expect(typeMimeDe('a.DOCX')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(typeMimeDe('a.xyz')).toBe('application/octet-stream')
  })
})

describe('Word', () => {
  const docx = ecrireZip({
    'word/_rels/document.xml.rels': '<Relationships><Relationship Id="rId1" Type="image" Target="media/image1.png"/><Relationship Id="rId2" Type="hyperlink" Target="https://exemple.org"/></Relationships>',
    'word/media/image1.png': PNG,
    'word/document.xml': `<w:document><w:body>
      <w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>Méditations</w:t></w:r></w:p>
      <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Jour 1</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Gras</w:t></w:r><w:r><w:t xml:space="preserve"> et </w:t></w:r><w:r><w:rPr><w:i/><w:b w:val="0"/></w:rPr><w:t>italique</w:t></w:r></w:p>
      <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Un</w:t></w:r></w:p>
      <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Deux</w:t></w:r></w:p>
      <w:p/>
      <w:tbl><w:tr><w:tc><w:p><w:r><w:t>A1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B1</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
      <w:p><w:r><w:drawing><a:blip r:embed="rId1"/></w:drawing></w:r></w:p>
      <w:p><w:hyperlink r:id="rId2"><w:r><w:t>lien</w:t></w:r></w:hyperlink></w:p>
      <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Jour 2</w:t></w:r></w:p>
      <w:p><w:r><w:t>Fin &amp; suite</w:t></w:r></w:p>
    </w:body></w:document>`,
  })
  it('titres, gras, italique, liste groupée, tableau, image en data:, lien, entités — sectionné par Titre 1', async () => {
    const unites = await unitesDuDocument(tampon(docx), 'meditations.docx')
    // Le titre du document, sans contenu propre, ouvre le premier jour au lieu d'en faire un vide.
    expect(unites.map((u) => u.titre)).toEqual(['Jour 1', 'Jour 2'])
    const j1 = unites[0].html
    expect(j1).toContain('<h1>Méditations</h1>\n<h1>Jour 1</h1>')
    expect(j1).toContain('<p><strong>Gras</strong> et <em>italique</em></p>')
    expect(j1).toContain('<ul><li>Un</li><li>Deux</li></ul>')
    expect(j1).toContain('<table><tr><td><p>A1</p></td><td><p>B1</p></td></tr></table>')
    expect(j1).toContain('<img src="data:image/png;base64,')
    expect(j1).toContain('<a href="https://exemple.org" target="_blank" rel="noopener">lien</a>')
    expect(unites[1].html).toContain('<p>Fin &amp; suite</p>')
  })
  it('la structure pour l’éditeur : une unité par « page », son titre en repère', async () => {
    const s = structureDesUnites(await unitesDuDocument(tampon(docx), 'm.docx'))
    expect(s.pages).toBe(2)
    expect(s.reperes[1]).toEqual({ page: 2, titre: 'Jour 2', niveau: 1 })
    expect(s.premieresLignes[0]).toBe('Jour 1')
  })
})

describe('OpenDocument', () => {
  const odt = ecrireZip({
    'Pictures/a.png': PNG,
    'content.xml': `<office:document-content><office:automatic-styles>
      <style:style style:name="T1" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>
      <style:style style:name="T2" style:family="text"><style:text-properties fo:font-style="italic" style:text-underline-style="solid"/></style:style>
    </office:automatic-styles><office:body><office:text>
      <text:h text:outline-level="1">Un</text:h>
      <text:p>Du <text:span text:style-name="T1">gras</text:span> et de l’<text:span text:style-name="T2">italique</text:span><text:line-break/>suite<text:s text:c="2"/>fin</text:p>
      <text:list><text:list-item><text:p>a</text:p></text:list-item><text:list-item><text:p>b</text:p></text:list-item></text:list>
      <table:table><table:table-row><table:table-cell><text:p>c1</text:p></table:table-cell></table:table-row></table:table>
      <text:p><draw:frame><draw:image xlink:href="Pictures/a.png"/></draw:frame></text:p>
      <text:h text:outline-level="1">Deux</text:h>
      <text:p>Texte</text:p>
    </office:text></office:body></office:document-content>`,
  })
  it('titres de niveau, styles automatiques, listes, tableau, image, saut et espaces', async () => {
    const unites = await unitesDuDocument(tampon(odt), 'x.odt')
    expect(unites.map((u) => u.titre)).toEqual(['Un', 'Deux'])
    const u = unites[0].html
    expect(u).toContain('<h1>Un</h1>')
    expect(u).toContain('<p>Du <strong>gras</strong> et de l’<u><em>italique</em></u><br>suite  fin</p>')
    expect(u).toContain('<ul><li>a</li><li>b</li></ul>')
    expect(u).toContain('<table><tr><td><p>c1</p></td></tr></table>')
    expect(u).toContain('<img src="data:image/png;base64,')
  })
})

describe('HTML', () => {
  it('le corps, sans scripts ni feuilles, coupé à ses titres', () => {
    const blocs = blocsHtml('<html><head><style>p{}</style></head><body><script>alert(1)</script><p>Intro</p><h2>A</h2><p>a</p><h2>B</h2><p>b</p></body></html>')
    expect(blocs.map((b) => b.niveau ?? 0)).toEqual([0, 2, 0, 2, 0])
    const unites = sectionner(blocs)
    expect(unites.map((u) => u.titre)).toEqual(['Intro', 'A', 'B'])
    expect(unites.join()).not.toContain('alert')
  })
})

describe('EPUB', () => {
  const epub = ecrireZip({
    'META-INF/container.xml': '<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>',
    'OEBPS/content.opf': `<package><manifest>
      <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
      <item id="c1" href="text/ch1.xhtml" media-type="application/xhtml+xml"/>
      <item id="c2" href="text/ch2.xhtml" media-type="application/xhtml+xml"/>
      <item id="css" href="style.css" media-type="text/css"/>
      <item id="img" href="images/a.png" media-type="image/png"/>
    </manifest><spine><itemref idref="nav"/><itemref idref="c1"/><itemref idref="c2"/></spine></package>`,
    'OEBPS/nav.xhtml': '<html><body><nav epub:type="toc"><ol><li><a href="text/ch1.xhtml">Premier chapitre</a></li><li><a href="text/ch2.xhtml#debut">Second</a></li></ol></nav></body></html>',
    'OEBPS/style.css': 'p{text-indent:1em;font-family:Serif;color:red} @font-face{font-family:X;src:url(x)}',
    'OEBPS/images/a.png': PNG,
    'OEBPS/text/ch1.xhtml': '<html><head><link rel="stylesheet" href="../style.css"/></head><body><h1>Chapitre 1</h1><p>Texte <em>riche</em>.</p><img src="../images/a.png"/></body></html>',
    'OEBPS/text/ch2.xhtml': '<html><head><title>Deux</title></head><body><p>Suite.</p></body></html>',
  })
  it('un chapitre par entrée de la spine (sans le nav), titres de la table des matières, feuille filtrée, image en data:', async () => {
    const unites = await unitesDuDocument(tampon(epub), 'livre.epub')
    expect(unites.map((u) => u.titre)).toEqual(['Premier chapitre', 'Second'])
    expect(unites[0].html).toMatch(/^<style>p\{text-indent:1em;\}\s*<\/style>/)
    expect(unites[0].html).not.toContain('font-family')
    expect(unites[0].html).toContain('<p>Texte <em>riche</em>.</p>')
    expect(unites[0].html).toContain('src="data:image/png;base64,')
    expect(unites[1].html).toBe('<p>Suite.</p>')
  })
  it('sans table des matières, le titre vient du premier titre du chapitre, sinon du <title>', async () => {
    const sans = ecrireZip({
      'META-INF/container.xml': '<container><rootfiles><rootfile full-path="c.opf"/></rootfiles></container>',
      'c.opf': '<package><manifest><item id="a" href="a.xhtml" media-type="application/xhtml+xml"/><item id="b" href="b.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="a"/><itemref idref="b"/></spine></package>',
      'a.xhtml': '<html><body><h2>Du titre</h2><p>x</p></body></html>',
      'b.xhtml': '<html><head><title>Du head</title></head><body><p>y</p></body></html>',
    })
    expect((await unitesDuDocument(tampon(sans), 'l.epub')).map((u) => u.titre)).toEqual(['Du titre', 'Du head'])
  })
})

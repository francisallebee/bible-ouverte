import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, LOCALES, isLocale, localeInfo, resolveLocale, textDirection } from './locales'
import { BOOKS_FR, bookName, bookNames } from './books'
import { contextName } from './contexts'
import { formatDate, parseJour, monthNames, weekdayNames } from './format'
import { AVAILABLE_LOCALES, DICTIONARIES, dictionary } from './ui'
import { fr } from './ui/fr'
import { ar } from './ui/ar'
import { BOOKS } from '@/features/bible/books'

describe('le choix de la langue', () => {
  it('respecte le choix explicite avant tout', () => {
    expect(resolveLocale('en', ['fr-FR', 'fr'])).toBe('en')
  })

  it('retombe sur le navigateur quand rien n’est choisi', () => {
    expect(resolveLocale(undefined, ['en-US', 'en'])).toBe('en')
  })

  it('reconnaît une variante régionale', () => {
    expect(resolveLocale(undefined, ['fr-CA'])).toBe('fr')
    expect(resolveLocale(undefined, ['en-AU'])).toBe('en')
  })

  it('passe une langue inconnue et prend la suivante', () => {
    expect(resolveLocale(undefined, ['de-DE', 'pt', 'es-MX'])).toBe('es')
  })

  it('rend le français quand rien ne correspond', () => {
    expect(resolveLocale(undefined, ['de', 'ja'])).toBe(DEFAULT_LOCALE)
    expect(resolveLocale(undefined, [])).toBe('fr')
  })

  it('ignore un choix qui n’est pas une langue connue', () => {
    // Une valeur venue des réglages d'une version future, ou corrompue.
    expect(resolveLocale('klingon', ['en'])).toBe('en')
  })

  it('sait reconnaître une langue', () => {
    expect(isLocale('ar')).toBe(true)
    expect(isLocale('de')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})

describe('le sens d’écriture', () => {
  it('met l’arabe à droite-à-gauche, et lui seul', () => {
    const rtl = LOCALES.filter((l) => l.dir === 'rtl').map((l) => l.code)
    expect(rtl).toEqual(['ar'])
  })

  it('donne une étiquette BCP 47 à chaque langue', () => {
    for (const l of LOCALES) {
      expect(l.tag.length, l.code).toBeGreaterThan(0)
      // `Intl` doit savoir la lire, sinon les dates repasseraient en anglais.
      expect(() => new Intl.DateTimeFormat(l.tag), l.code).not.toThrow()
    }
  })

  it('rend le français pour une langue inconnue', () => {
    expect(localeInfo('zz' as never).code).toBe('fr')
  })
})

describe('les noms de livres', () => {
  it('couvre les 66 livres, sans clé dupliquée', () => {
    // Une clé répétée dans un objet littéral écrase silencieusement la
    // première : le typage ne la voit pas, ce compte si.
    expect(Object.keys(BOOKS_FR)).toHaveLength(66)
  })

  it('couvre exactement les livres de l’application', () => {
    const attendus = BOOKS.map((b) => b.abbreviation).sort()
    expect(Object.keys(BOOKS_FR).sort()).toEqual(attendus)
  })

  it('garde les noms français de `BOOKS` à l’identique', () => {
    // La table i18n remplace `books.ts` à l'affichage : elle ne doit rien
    // changer pour un utilisateur francophone.
    for (const livre of BOOKS) {
      expect(bookName('fr', livre.abbreviation), livre.abbreviation)
        .toBe(livre.name)
    }
  })

  it('traduit en anglais sans laisser de trou', () => {
    for (const code of Object.keys(BOOKS_FR)) {
      const nom = bookName('en', code)
      expect(nom.length, code).toBeGreaterThan(0)
      expect(nom, code).not.toBe(code)
    }
  })

  it('rend le code brut pour un livre inconnu', () => {
    expect(bookName('fr', 'XYZ')).toBe('XYZ')
  })

  it('retombe sur le français pour une langue sans table', () => {
    expect(bookNames('ar')).toBe(bookNames('fr'))
  })
})

describe('les noms de contextes', () => {
  it('traduit un contexte système', () => {
    expect(contextName('en', 'meditation', 'Méditation', true)).toBe('Meditation')
  })

  it('laisse intact un contexte créé par l’utilisateur', () => {
    // Ce que la personne a tapé lui appartient — même si le mot existe dans
    // notre table.
    expect(contextName('en', 'meditation', 'Méditation', false)).toBe('Méditation')
    expect(contextName('en', 'zoom', 'ZOOM', false)).toBe('ZOOM')
  })

  it('garde le nom stocké pour un slug système inconnu', () => {
    expect(contextName('en', 'inconnu', 'Quelque chose', true)).toBe('Quelque chose')
  })
})

describe('les dictionnaires', () => {
  /** Toutes les clés d'un dictionnaire, en notation pointée. */
  function cles(objet: object, prefixe = ''): string[] {
    return Object.entries(objet).flatMap(([cle, valeur]) => {
      const chemin = prefixe ? `${prefixe}.${cle}` : cle
      return valeur !== null && typeof valeur === 'object'
        ? cles(valeur, chemin)
        : [chemin]
    })
  }

  it('donne la même forme à toutes les langues', () => {
    const reference = cles(fr).sort()
    for (const [code, dico] of Object.entries(DICTIONARIES)) {
      expect(cles(dico!).sort(), code).toEqual(reference)
    }
  })

  it('ne laisse aucune chaîne vide', () => {
    for (const [code, dico] of Object.entries(DICTIONARIES)) {
      const vides = cles(dico!).filter((chemin) => {
        const valeur = chemin.split('.').reduce<any>((o, k) => o?.[k], dico)
        return typeof valeur === 'string' && valeur.trim().length === 0
      })
      expect(vides, code).toEqual([])
    }
  })

  it('ne propose que les langues réellement traduites', () => {
    // Une langue déclarée dans LOCALES mais sans dictionnaire ne doit pas
    // apparaître au sélecteur : on ne choisit pas une langue à moitié faite.
    const proposees = AVAILABLE_LOCALES.map((l) => l.code)
    expect(proposees).toEqual(Object.keys(DICTIONARIES))
    for (const code of proposees) {
      expect(DICTIONARIES[code], code).toBeDefined()
    }
  })

  it('retombe sur le français pour une langue sans dictionnaire', () => {
    // Ce test citait `ar` jusqu'au 15 août 2026, jour où l'arabe a reçu le
    // sien : les cinq langues de LOCALES sont désormais toutes traduites. Le
    // garde-fou garde tout son sens — il couvre la langue qu'on déclarera
    // avant de l'écrire — mais il lui faut un code hors registre pour rester
    // vrai.
    expect(dictionary('pt' as never)).toBe(fr)
  })
})

describe('les dates', () => {
  it('lit un jour nu sans reculer d’une journée', () => {
    // `new Date('2026-08-15')` vaut minuit UTC : à l'ouest de Greenwich, la
    // date affichée devient le 14.
    const jour = parseJour('2026-08-15')
    expect(jour.getFullYear()).toBe(2026)
    expect(jour.getMonth()).toBe(7)
    expect(jour.getDate()).toBe(15)
  })

  it('formate dans la langue demandée', () => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
    expect(formatDate('fr', '2026-08-15', options)).toContain('août')
    expect(formatDate('en', '2026-08-15', options)).toContain('August')
  })

  it('donne douze mois et sept jours, traduits', () => {
    expect(monthNames('fr')).toHaveLength(12)
    expect(weekdayNames('en', 'long')).toHaveLength(7)
    expect(weekdayNames('en', 'long')[0]).toBe('Monday')
    expect(weekdayNames('fr', 'long')[0]).toBe('lundi')
  })
})

describe("le pluriel de l'arabe", () => {
  /**
   * L'arabe distingue six formes là où le français en a deux, et le nom
   * repasse au singulier après 11 — ce qu'aucun `s` conditionnel ne sait
   * faire. C'est la règle CLDR, et c'est de la logique : elle se teste.
   */
  const compte = (n: number) => ar.history.readingCount(n)

  it('emploie une forme distincte pour zéro, un et le duel', () => {
    expect(compte(0)).toBe('0 قراءة')
    expect(compte(1)).toBe('1 قراءة واحدة')
    expect(compte(2)).toBe('2 قراءتان')
  })

  it('emploie le pluriel de petit nombre de 3 à 10', () => {
    expect(compte(3)).toBe('3 قراءات')
    expect(compte(10)).toBe('10 قراءات')
  })

  it('revient au singulier de 11 à 99', () => {
    expect(compte(11)).toBe('11 قراءة')
    expect(compte(99)).toBe('99 قراءة')
  })

  it('reprend les mêmes formes selon les deux derniers chiffres', () => {
    // 103 se comporte comme 3, 111 comme 11 — c'est le reste modulo 100 qui
    // décide, et non la grandeur du nombre. Seule la forme se compare : le
    // nombre lui-même fait partie de la chaîne.
    const forme = (n: number) => compte(n).replace(`${n} `, '')
    expect(forme(103)).toBe(forme(3))
    expect(forme(111)).toBe(forme(11))
    expect(forme(100)).toBe(forme(1000))
    expect(compte(100)).toBe('100 قراءة')
  })

  it('applique la même règle aux autres compteurs', () => {
    expect(ar.progress.chapterCount(2)).toBe('2 إصحاحان')
    expect(ar.progress.chapterCount(5)).toBe('5 إصحاحات')
    expect(ar.search.verseCount(1)).toBe('1 عدد واحد')
    expect(ar.support.replyCount(3)).toBe('3 ردود')
  })
})

describe("l'arabe au registre", () => {
  it('est proposable et se lit de droite à gauche', () => {
    expect(DICTIONARIES.ar).toBeDefined()
    expect(AVAILABLE_LOCALES.map((l) => l.code)).toContain('ar')
    expect(localeInfo('ar').dir).toBe('rtl')
  })

  it("est la seule langue à droite-à-gauche pour l'instant", () => {
    const rtl = LOCALES.filter((l) => l.dir === 'rtl').map((l) => l.code)
    expect(rtl).toEqual(['ar'])
  })
})

describe("le sens d'écriture d'un texte biblique", () => {
  /**
   * Il suit la **version lue**, pas la langue de l'interface : depuis le
   * 16 août 2026, `public/bibles/` porte la Smith & Van Dyck arabe, qu'on peut
   * consulter dans une application réglée en français.
   */
  it('met la version arabe de droite à gauche', () => {
    expect(textDirection('ar')).toBe('rtl')
  })

  it('laisse les autres langues de gauche à droite', () => {
    for (const code of ['fr', 'en', 'it', 'es']) {
      expect(textDirection(code), code).toBe('ltr')
    }
  })

  it("traite une langue inconnue du registre comme gauche-à-droite", () => {
    // Le jour où une version allemande arriverait, avant que `de` soit une
    // locale d'interface.
    expect(textDirection('de')).toBe('ltr')
    expect(textDirection('')).toBe('ltr')
  })
})

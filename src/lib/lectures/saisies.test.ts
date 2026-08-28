import { describe, it, expect } from "vitest";
import type { ReadingEntry } from "@/lib/storage";
import {
  grouperParSaisie, referencesDe, referenceDe, SEUIL_MEME_SAISIE_MS,
} from "./saisies";

/** Une lecture minimale : seuls la date, l'instant et la référence comptent ici. */
function lecture(
  id: number,
  date: string,
  createdAt: string | undefined,
  reference: Partial<Pick<ReadingEntry, "book" | "chapterStart" | "chapterEnd" | "verseStart" | "verseEnd">> = {},
): ReadingEntry {
  return {
    id,
    date,
    book: reference.book ?? "JHN",
    chapterStart: reference.chapterStart ?? 3,
    chapterEnd: reference.chapterEnd ?? reference.chapterStart ?? 3,
    verseStart: reference.verseStart ?? 16,
    verseEnd: reference.verseEnd ?? reference.verseStart ?? 16,
    passageText: "",
    translationId: "lsg1910",
    tags: [],
    contextId: "",
    notes: "",
    userId: "u1",
    createdAt: createdAt as string,
    updatedAt: createdAt as string,
  };
}

/** Le nom du livre, réduit à ce que les tests ont besoin de lire. */
const nom = (code: string) => ({ JHN: "Jean", GEN: "Genèse", LUK: "Luc" }[code] ?? code);

describe("grouperParSaisie", () => {
  it("ne rend rien sur une liste vide", () => {
    expect(grouperParSaisie([])).toEqual([]);
  });

  it("rend un groupe d'une seule lecture", () => {
    const groupes = grouperParSaisie([lecture(1, "2026-08-20", "2026-08-20T08:30:44.000Z")]);
    expect(groupes).toHaveLength(1);
    expect(groupes[0].entrees).toHaveLength(1);
  });

  it("réunit deux lectures écrites coup sur coup", () => {
    const groupes = grouperParSaisie([
      lecture(1, "2026-08-20", "2026-08-20T08:30:44.000Z"),
      lecture(2, "2026-08-20", "2026-08-20T08:30:44.072Z"),
    ]);
    expect(groupes).toHaveLength(1);
    expect(groupes[0].entrees.map((e) => e.id)).toEqual([1, 2]);
  });

  it("sépare deux lectures éloignées de plus du seuil", () => {
    const groupes = grouperParSaisie([
      lecture(1, "2026-08-20", "2026-08-20T08:30:44.000Z"),
      lecture(2, "2026-08-20", "2026-08-20T08:30:50.000Z"),
    ]);
    expect(groupes).toHaveLength(2);
  });

  /**
   * Le point que « la même seconde » manquait.
   *
   * Trois lectures espacées de 4 secondes chacune couvrent 8 secondes — plus
   * que le seuil — et forment pourtant un seul enregistrement, puisque aucun
   * écart ne l'atteint. C'est le cas réel mesuré : une saisie de 8,88 s.
   */
  it("chaîne de proche en proche au-delà de la durée du seuil", () => {
    const groupes = grouperParSaisie([
      lecture(1, "2026-08-20", "2026-08-20T08:30:40.000Z"),
      lecture(2, "2026-08-20", "2026-08-20T08:30:44.000Z"),
      lecture(3, "2026-08-20", "2026-08-20T08:30:48.000Z"),
    ]);
    expect(groupes).toHaveLength(1);
    expect(groupes[0].entrees).toHaveLength(3);
  });

  it("ne réunit pas deux lectures de dates différentes, si proches soient-elles", () => {
    const groupes = grouperParSaisie([
      lecture(1, "2026-08-19", "2026-08-20T08:30:44.000Z"),
      lecture(2, "2026-08-20", "2026-08-20T08:30:44.050Z"),
    ]);
    expect(groupes).toHaveLength(2);
  });

  /** La séance réelle du 20 août : 39 passages en 2,816 secondes. */
  it("garde entière une saisie de 39 passages étalée sur près de trois secondes", () => {
    const depart = Date.parse("2026-08-20T08:30:44.110Z");
    const entrees = Array.from({ length: 39 }, (_, i) =>
      lecture(i + 1, "2026-08-20", new Date(depart + i * 72).toISOString()));
    const groupes = grouperParSaisie(entrees);
    expect(groupes).toHaveLength(1);
    expect(groupes[0].entrees).toHaveLength(39);
  });

  it("regroupe correctement des lectures arrivées dans le désordre", () => {
    const groupes = grouperParSaisie([
      lecture(3, "2026-08-20", "2026-08-20T08:30:44.200Z"),
      lecture(1, "2026-08-20", "2026-08-20T08:30:44.000Z"),
      lecture(2, "2026-08-20", "2026-08-20T08:30:44.100Z"),
    ]);
    expect(groupes).toHaveLength(1);
    expect(groupes[0].entrees.map((e) => e.id)).toEqual([1, 2, 3]);
  });

  it("laisse seule une lecture sans date de création", () => {
    const groupes = grouperParSaisie([
      lecture(1, "2026-08-20", "2026-08-20T08:30:44.000Z"),
      lecture(2, "2026-08-20", undefined),
      lecture(3, "2026-08-20", "2026-08-20T08:30:44.100Z"),
    ]);
    expect(groupes).toHaveLength(2);
    expect(groupes.find((g) => g.entrees.length === 2)?.entrees.map((e) => e.id)).toEqual([1, 3]);
    expect(groupes.find((g) => g.entrees.length === 1)?.entrees[0].id).toBe(2);
  });

  it("laisse seule une lecture dont la date de création est illisible", () => {
    const groupes = grouperParSaisie([
      lecture(1, "2026-08-20", "2026-08-20T08:30:44.000Z"),
      lecture(2, "2026-08-20", "pas une date"),
    ]);
    expect(groupes).toHaveLength(2);
  });

  it("rend les groupes du plus récent au plus ancien", () => {
    const groupes = grouperParSaisie([
      lecture(1, "2026-08-20", "2026-08-20T08:00:00.000Z"),
      lecture(2, "2026-08-20", "2026-08-20T10:00:00.000Z"),
      lecture(3, "2026-08-20", "2026-08-20T09:00:00.000Z"),
    ]);
    expect(groupes.map((g) => g.entrees[0].id)).toEqual([2, 3, 1]);
  });

  it("donne à chaque groupe une clé tirée de sa première lecture", () => {
    const groupes = grouperParSaisie([lecture(7, "2026-08-20", "2026-08-20T08:30:44.000Z")]);
    expect(groupes[0].cle).toBe("s:7");
  });

  it("accepte un seuil injecté", () => {
    const entrees = [
      lecture(1, "2026-08-20", "2026-08-20T08:30:44.000Z"),
      lecture(2, "2026-08-20", "2026-08-20T08:30:46.000Z"),
    ];
    expect(grouperParSaisie(entrees, 1000)).toHaveLength(2);
    expect(grouperParSaisie(entrees, 5000)).toHaveLength(1);
  });

  it("porte un seuil par défaut de cinq secondes", () => {
    expect(SEUIL_MEME_SAISIE_MS).toBe(5000);
  });

  it("ne perd aucune lecture", () => {
    const entrees = [
      lecture(1, "2026-08-20", "2026-08-20T08:30:44.000Z"),
      lecture(2, "2026-08-20", "2026-08-20T09:30:44.000Z"),
      lecture(3, "2026-08-19", "2026-08-19T08:30:44.000Z"),
      lecture(4, "2026-08-20", undefined),
    ];
    const total = grouperParSaisie(entrees).reduce((n, g) => n + g.entrees.length, 0);
    expect(total).toBe(entrees.length);
  });
});

describe("referenceDe", () => {
  it("écrit un verset unique sans intervalle", () => {
    expect(referenceDe(lecture(1, "2026-08-20", undefined), nom)).toBe("Jean 3:16");
  });

  it("écrit l'intervalle de versets quand il y en a un", () => {
    const entree = lecture(1, "2026-08-20", undefined, { verseStart: 1, verseEnd: 11 });
    expect(referenceDe(entree, nom)).toBe("Jean 3:1-11");
  });

  it("écrit l'intervalle de chapitres quand il y en a un", () => {
    const entree = lecture(1, "2026-08-20", undefined, { chapterStart: 3, chapterEnd: 4 });
    expect(referenceDe(entree, nom)).toBe("Jean 3-4:16");
  });
});

describe("referencesDe", () => {
  it("garde l'ordre des passages", () => {
    const lot = [
      lecture(1, "2026-08-20", undefined, { book: "GEN", chapterStart: 1, verseStart: 1 }),
      lecture(2, "2026-08-20", undefined, { book: "LUK", chapterStart: 2, verseStart: 7 }),
    ];
    expect(referencesDe(lot, nom)).toEqual(["Genèse 1:1", "Luc 2:7"]);
  });

  it("ne répète pas deux fois la même référence", () => {
    const lot = [
      lecture(1, "2026-08-20", undefined, { book: "JHN", chapterStart: 3, verseStart: 16 }),
      lecture(2, "2026-08-20", undefined, { book: "JHN", chapterStart: 3, verseStart: 16 }),
    ];
    expect(referencesDe(lot, nom)).toEqual(["Jean 3:16"]);
  });
});

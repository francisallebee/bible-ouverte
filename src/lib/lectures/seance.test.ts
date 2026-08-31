import { describe, it, expect } from "vitest";
import {
  lecturesDeLaSeance, type PassageDeSeance, type CadreDeSeance,
} from "./seance";

/**
 * Ce que ces tests protègent.
 *
 * L'empilement des passages a déjà vécu une fois, et il a été retiré parce
 * qu'il écrivait onze fois la même note et la même photo. Sa règle de partage
 * — ce qui est commun à la séance, ce qui suit le passage — est exactement ce
 * qu'aucun typage ne peut tenir : recopier un champ de trop compile
 * parfaitement, et ne se voit qu'en base, une fois les lignes écrites.
 */

const cadre: CadreDeSeance = {
  date: "2026-08-31",
  contextId: "meditation",
  versionId: "ls1910",
};

function passage(over: Partial<PassageDeSeance> = {}): PassageDeSeance {
  return {
    book: "PRO",
    chapterStart: 18,
    chapterEnd: 18,
    verseStart: 1,
    verseEnd: 24,
    notes: "",
    links: [],
    photos: [],
    ...over,
  };
}

describe("lecturesDeLaSeance", () => {
  it("écrit une lecture par passage", () => {
    // Non négociable : les statistiques, la progression et les plans
    // raisonnent par lecture. Le regroupement est un fait d'affichage.
    const lectures = lecturesDeLaSeance(cadre, [
      passage({ book: "PRO" }),
      passage({ book: "JHN", chapterStart: 3, chapterEnd: 3, verseStart: 16, verseEnd: 17 }),
    ], null);
    expect(lectures).toHaveLength(2);
    expect(lectures.map((l) => l.book)).toEqual(["PRO", "JHN"]);
  });

  it("donne à toutes la même date, le même contexte et la même version", () => {
    const lectures = lecturesDeLaSeance(cadre, [passage(), passage({ book: "PSA" })], null);
    for (const l of lectures) {
      expect(l.date).toBe("2026-08-31");
      expect(l.contextId).toBe("meditation");
      expect(l.translationId).toBe("ls1910");
    }
  });

  it("laisse les notes et les médias à leur seul passage", () => {
    // Le cœur de la reprise du 31 août 2026 : l'ancienne version recopiait la
    // note et les photos sur chaque ligne écrite.
    const lectures = lecturesDeLaSeance(cadre, [
      passage({ notes: "sur la vraie amitié", photos: ["data:image/png;base64,AAA"] }),
      passage({ book: "PSA", notes: "" }),
    ], null);
    expect(lectures[0].notes).toBe("sur la vraie amitié");
    expect(lectures[0].photos).toEqual(["data:image/png;base64,AAA"]);
    expect(lectures[1].notes).toBe("");
    expect(lectures[1].photos).toBeUndefined();
  });

  it("compte le passage encore dans le formulaire, et le met en dernier", () => {
    // Sans cela, enregistrer une seule lecture obligerait à cliquer
    // « Ajouter ce passage » d'abord — le cas simple cesserait d'être simple.
    const lectures = lecturesDeLaSeance(cadre, [passage({ book: "PSA" })], passage({ book: "JHN" }));
    expect(lectures.map((l) => l.book)).toEqual(["PSA", "JHN"]);
  });

  it("enregistre une lecture unique jamais ajoutée à la liste", () => {
    const lectures = lecturesDeLaSeance(cadre, [], passage());
    expect(lectures).toHaveLength(1);
    expect(lectures[0].book).toBe("PRO");
  });

  it("n'écrit rien quand aucun passage n'est saisi", () => {
    // Des notes seules ne font pas une lecture.
    expect(lecturesDeLaSeance(cadre, [], null)).toEqual([]);
  });

  it("n'écrit rien sans version : une lecture sans traduction n'a pas de texte", () => {
    expect(lecturesDeLaSeance({ ...cadre, versionId: "" }, [passage()], null)).toEqual([]);
  });

  it("laisse les colonnes facultatives indéfinies plutôt que vides", () => {
    const [lecture] = lecturesDeLaSeance(cadre, [], passage());
    expect(lecture.links).toBeUndefined();
    expect(lecture.photos).toBeUndefined();
    expect(lecture.audio).toBeUndefined();
  });
});

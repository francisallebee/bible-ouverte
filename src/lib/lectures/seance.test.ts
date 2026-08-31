import { describe, it, expect } from "vitest";
import {
  lecturesDeLaSeance, type PassageDeSeance, type CadreDeSeance,
} from "./seance";

/**
 * Ce que ces tests protègent.
 *
 * L'empilement des passages a déjà vécu une fois. Sa règle de partage — ce qui
 * vaut pour la séance, ce qui vaut pour une ligne — est exactement ce qu'aucun
 * typage ne peut tenir : oublier de recopier un champ compile parfaitement, et
 * ne se voit qu'en base, une fois les lignes écrites.
 */

const cadre: CadreDeSeance = {
  date: "2026-08-31",
  contextId: "meditation",
  versionId: "ls1910",
  notes: "",
  links: [],
  photos: [],
};

function passage(over: Partial<PassageDeSeance> = {}): PassageDeSeance {
  return {
    book: "PRO",
    chapterStart: 18,
    chapterEnd: 18,
    verseStart: 1,
    verseEnd: 24,
    ...over,
  };
}

describe("lecturesDeLaSeance", () => {
  it("écrit une lecture par passage validé", () => {
    // Non négociable : les statistiques, la progression et les plans
    // raisonnent par lecture. Le regroupement est un fait d'affichage.
    const lectures = lecturesDeLaSeance(cadre, [
      passage({ book: "PRO" }),
      passage({ book: "JHN", chapterStart: 3, chapterEnd: 3, verseStart: 16, verseEnd: 17 }),
    ]);
    expect(lectures).toHaveLength(2);
    expect(lectures.map((l) => l.book)).toEqual(["PRO", "JHN"]);
  });

  it("garde l'ordre de validation", () => {
    const lectures = lecturesDeLaSeance(cadre, [
      passage({ book: "PSA" }), passage({ book: "JHN" }), passage({ book: "PRO" }),
    ]);
    expect(lectures.map((l) => l.book)).toEqual(["PSA", "JHN", "PRO"]);
  });

  it("donne à toutes la même date, le même contexte et la même version", () => {
    const lectures = lecturesDeLaSeance(cadre, [passage(), passage({ book: "PSA" })]);
    for (const l of lectures) {
      expect(l.date).toBe("2026-08-31");
      expect(l.contextId).toBe("meditation");
      expect(l.translationId).toBe("ls1910");
    }
  });

  it("recopie les notes et les médias sur chaque ligne", () => {
    // Le passage part au panneau avant que la note soit écrite : elle ne peut
    // appartenir qu'à la séance. Le coût est cette recopie, assumée.
    const lectures = lecturesDeLaSeance({
      ...cadre,
      notes: "sur la vraie amitié",
      photos: ["data:image/png;base64,AAA"],
      links: [{ url: "https://exemple.fr", title: "Un commentaire" }],
      audio: "data:audio/webm;base64,BBB",
    }, [passage(), passage({ book: "PSA" }), passage({ book: "JHN" })]);

    expect(lectures).toHaveLength(3);
    for (const l of lectures) {
      expect(l.notes).toBe("sur la vraie amitié");
      expect(l.photos).toEqual(["data:image/png;base64,AAA"]);
      expect(l.links).toEqual([{ url: "https://exemple.fr", title: "Un commentaire" }]);
      expect(l.audio).toBe("data:audio/webm;base64,BBB");
    }
  });

  it("enregistre une lecture unique comme les autres", () => {
    // Le cas simple n'a rien de particulier : un passage validé, une ligne.
    const lectures = lecturesDeLaSeance(cadre, [passage()]);
    expect(lectures).toHaveLength(1);
    expect(lectures[0].book).toBe("PRO");
  });

  it("n'écrit rien quand le panneau est vide", () => {
    // Des notes seules ne font pas une lecture.
    expect(lecturesDeLaSeance({ ...cadre, notes: "une pensée" }, [])).toEqual([]);
  });

  it("n'écrit rien sans version : une lecture sans traduction n'a pas de texte", () => {
    expect(lecturesDeLaSeance({ ...cadre, versionId: "" }, [passage()])).toEqual([]);
  });

  it("laisse les colonnes facultatives indéfinies plutôt que vides", () => {
    const [lecture] = lecturesDeLaSeance(cadre, [passage()]);
    expect(lecture.links).toBeUndefined();
    expect(lecture.photos).toBeUndefined();
    expect(lecture.audio).toBeUndefined();
  });
});

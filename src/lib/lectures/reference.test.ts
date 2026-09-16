import { describe, it, expect } from "vitest";
import { ecrireReference, chapitresEntiers } from "./reference";

const i = (chapterStart: number, chapterEnd: number, verseStart: number, verseEnd: number) =>
  ({ chapterStart, chapterEnd, verseStart, verseEnd });

describe("ecrireReference", () => {
  it("écrit un verset seul", () => {
    expect(ecrireReference("Jean", "JHN", i(3, 3, 16, 16))).toBe("Jean 3:16");
  });

  it("écrit un intervalle dans un chapitre", () => {
    expect(ecrireReference("Jean", "JHN", i(3, 3, 16, 18))).toBe("Jean 3:16-18");
  });

  it("rattache le verset de fin à son chapitre quand l'intervalle enjambe", () => {
    // Le premier groupe à cheval, le 16 septembre 2026, s'écrivait
    // « Psaumes 23-24:6-2 » — chapitres et versets composés chacun de leur
    // côté, sans dire à quel chapitre appartient le 2.
    expect(ecrireReference("Psaumes", "PSA", i(23, 24, 6, 2))).toBe("Psaumes 23:6-24:2");
  });

  it("écrit les deux bornes même quand les numéros de verset coïncident", () => {
    // « Jean 3-4:16 » laissait croire à un seul verset sur deux chapitres.
    expect(ecrireReference("Jean", "JHN", i(3, 4, 16, 16))).toBe("Jean 3:16-4:16");
  });

  it("écrit un chapitre entier sans ses versets", () => {
    // Tite 3 compte 15 versets.
    expect(ecrireReference("Tite", "TIT", i(3, 3, 1, 15))).toBe("Tite 3");
  });

  it("écrit des chapitres entiers sans leurs versets", () => {
    expect(ecrireReference("Tite", "TIT", i(1, 3, 1, 15))).toBe("Tite 1-3");
  });

  it("tient un ancien repli au-delà du dernier verset pour un chapitre entier", () => {
    // Le sélecteur proposait 200 versets avant le ticket 25 ; « Psaumes 65:1-20 »
    // a été écrit pour un psaume qui en compte 13. Ce n'est pas un intervalle.
    expect(ecrireReference("Psaumes", "PSA", i(65, 65, 1, 20))).toBe("Psaumes 65");
    expect(ecrireReference("Genèse", "GEN", i(1, 50, 1, 200))).toBe("Genèse 1-50");
  });

  it("garde les versets d'un chapitre lu en partie depuis son début", () => {
    // Genèse 1 compte 31 versets : s'arrêter à 30, c'est ne pas le finir.
    expect(ecrireReference("Genèse", "GEN", i(1, 1, 1, 30))).toBe("Genèse 1:1-30");
    expect(ecrireReference("Genèse", "GEN", i(1, 4, 1, 1))).toBe("Genèse 1:1-4:1");
  });

  it("ne tient pas un chapitre commencé au deuxième verset pour entier", () => {
    expect(chapitresEntiers("TIT", i(3, 3, 2, 15))).toBe(false);
  });
});

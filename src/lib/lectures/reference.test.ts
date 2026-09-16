import { describe, it, expect } from "vitest";
import { ecrireReference } from "./reference";

describe("ecrireReference", () => {
  it("écrit un verset seul", () => {
    expect(ecrireReference("Jean", { chapterStart: 3, chapterEnd: 3, verseStart: 16, verseEnd: 16 }))
      .toBe("Jean 3:16");
  });

  it("écrit un intervalle dans un chapitre", () => {
    expect(ecrireReference("Jean", { chapterStart: 3, chapterEnd: 3, verseStart: 16, verseEnd: 18 }))
      .toBe("Jean 3:16-18");
  });

  it("rattache le verset de fin à son chapitre quand l'intervalle enjambe", () => {
    // Le premier groupe à cheval, le 16 septembre 2026, s'écrivait
    // « Psaumes 23-24:6-2 » — chapitres et versets composés chacun de leur
    // côté, sans dire à quel chapitre appartient le 2.
    expect(ecrireReference("Psaumes", { chapterStart: 23, chapterEnd: 24, verseStart: 6, verseEnd: 2 }))
      .toBe("Psaumes 23:6-24:2");
  });

  it("écrit les deux bornes même quand les numéros de verset coïncident", () => {
    // « Jean 3-4:16 » laissait croire à un seul verset sur deux chapitres.
    expect(ecrireReference("Jean", { chapterStart: 3, chapterEnd: 4, verseStart: 16, verseEnd: 16 }))
      .toBe("Jean 3:16-4:16");
  });
});

import { describe, expect, it } from "vitest";
import { estimateCardDefinitionCount, parseFlashcardDocument, parseSrSchedules } from "../src/parser";

describe("parseSrSchedules", () => {
  it("parses standard SR comments", () => {
    expect(parseSrSchedules("Q::A\n<!--SR:!2026-05-12,3,250-->")).toEqual([
      { dueDate: "2026-05-12", intervalDays: 3, ease: 250 }
    ]);
  });

  it("parses multiple schedule segments", () => {
    expect(parseSrSchedules("<!--SR:!2026-05-12,3,250!2026-05-13,4,260-->")).toEqual([
      { dueDate: "2026-05-12", intervalDays: 3, ease: 250 },
      { dueDate: "2026-05-13", intervalDays: 4, ease: 260 }
    ]);
  });

  it("collects warnings for malformed SR comments", () => {
    const warnings: string[] = [];
    expect(parseSrSchedules("<!--SR:not-a-schedule-->", warnings)).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});

describe("estimateCardDefinitionCount", () => {
  it("counts single line cards", () => {
    expect(estimateCardDefinitionCount("Q::A")).toBe(1);
  });

  it("counts bidirectional cards as two cards", () => {
    expect(estimateCardDefinitionCount("Q:::A")).toBe(2);
  });

  it("counts multiline separators", () => {
    expect(estimateCardDefinitionCount("Q\n?\nA\n\nB\n??\nC")).toBe(3);
  });

  it("counts cloze cards", () => {
    expect(estimateCardDefinitionCount("One ==answer== and {{another}}")).toBe(2);
  });

  it("ignores fenced code blocks", () => {
    expect(estimateCardDefinitionCount("```md\nQ::A\n```\nReal::Card")).toBe(1);
  });
});

describe("parseFlashcardDocument", () => {
  it("detects flashcard tags and combines estimates", () => {
    const parsed = parseFlashcardDocument("#flashcards/react\nQ::A\n<!--SR:!2026-05-12,3,250-->");
    expect(parsed.hasFlashcardTag).toBe(true);
    expect(parsed.cardDefinitionCount).toBe(1);
    expect(parsed.schedules).toHaveLength(1);
  });
});

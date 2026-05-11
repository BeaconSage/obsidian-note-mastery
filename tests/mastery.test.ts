import { describe, expect, it } from "vitest";
import { calculateCardMastery, calculateNoteMastery } from "../src/mastery";
import type { ParsedFlashcardDocument } from "../src/types";

describe("calculateCardMastery", () => {
  it("scores future mature high ease cards higher than overdue young cards", () => {
    const future = calculateCardMastery({ dueDate: "2026-05-20", intervalDays: 30, ease: 300 }, "2026-05-11");
    const overdue = calculateCardMastery({ dueDate: "2026-04-20", intervalDays: 1, ease: 130 }, "2026-05-11");
    expect(future.mastery).toBeGreaterThan(overdue.mastery);
    expect(future.isDue).toBe(false);
    expect(overdue.isDue).toBe(true);
  });

  it("treats cards due today as due", () => {
    const card = calculateCardMastery({ dueDate: "2026-05-11", intervalDays: 2, ease: 220 }, "2026-05-11");
    expect(card.isDue).toBe(true);
  });
});

describe("calculateNoteMastery", () => {
  it("penalizes unreviewed cards through coverage", () => {
    const parsed: ParsedFlashcardDocument = {
      hasFlashcardTag: true,
      cardDefinitionCount: 4,
      schedules: [
        { dueDate: "2026-05-20", intervalDays: 30, ease: 300 },
        { dueDate: "2026-05-20", intervalDays: 30, ease: 300 }
      ],
      warnings: []
    };

    const stats = calculateNoteMastery("A.md", "A", parsed, "2026-05-11");
    expect(stats.totalCards).toBe(4);
    expect(stats.reviewedCards).toBe(2);
    expect(stats.mastery).toBeLessThan(0.6);
  });

  it("protects against schedule count exceeding parsed card definitions", () => {
    const parsed: ParsedFlashcardDocument = {
      hasFlashcardTag: true,
      cardDefinitionCount: 1,
      schedules: [
        { dueDate: "2026-05-20", intervalDays: 3, ease: 250 },
        { dueDate: "2026-05-21", intervalDays: 4, ease: 260 }
      ],
      warnings: []
    };

    const stats = calculateNoteMastery("A.md", "A", parsed, "2026-05-11");
    expect(stats.totalCards).toBe(2);
    expect(stats.reviewedCards).toBe(2);
  });
});

import type { CardMastery, NoteMasteryStats, ParsedFlashcardDocument, SrSchedule } from "./types";

const MATURE_INTERVAL_DAYS = 30;
const MIN_EASE = 130;
const MAX_TARGET_EASE = 300;
const OVERDUE_GRACE_DAYS = 14;

export function calculateNoteMastery(
  path: string,
  basename: string,
  parsed: ParsedFlashcardDocument,
  today = toDateKey(new Date())
): NoteMasteryStats {
  const totalCards = Math.max(parsed.cardDefinitionCount, parsed.schedules.length);
  const cards = parsed.schedules.map((schedule) => calculateCardMastery(schedule, today));
  const reviewedCards = cards.length;
  const dueCards = cards.filter((card) => card.isDue).length;
  const averageInterval = average(parsed.schedules.map((schedule) => schedule.intervalDays));
  const averageEase = average(parsed.schedules.map((schedule) => schedule.ease));
  const nextDueDate = parsed.schedules.length > 0
    ? parsed.schedules.map((schedule) => schedule.dueDate).sort()[0]
    : null;
  const reviewedAverage = average(cards.map((card) => card.mastery)) ?? 0;
  const reviewedCoverage = totalCards > 0 ? reviewedCards / totalCards : 0;

  return {
    path,
    basename,
    totalCards,
    reviewedCards,
    dueCards,
    averageInterval,
    averageEase,
    nextDueDate,
    mastery: clamp(reviewedAverage * reviewedCoverage, 0, 1),
    warnings: parsed.warnings
  };
}

export function calculateCardMastery(schedule: SrSchedule, today = toDateKey(new Date())): CardMastery {
  const intervalScore = clamp(Math.log1p(schedule.intervalDays) / Math.log1p(MATURE_INTERVAL_DAYS), 0, 1);
  const easeScore = clamp((schedule.ease - MIN_EASE) / (MAX_TARGET_EASE - MIN_EASE), 0, 1);
  const overdueDays = Math.max(0, daysBetween(schedule.dueDate, today));
  const dueScore = compareDateKeys(schedule.dueDate, today) >= 0
    ? 1
    : clamp(1 - overdueDays / OVERDUE_GRACE_DAYS, 0, 1);

  return {
    schedule,
    mastery: clamp(0.5 * intervalScore + 0.3 * easeScore + 0.2 * dueScore, 0, 1),
    isDue: compareDateKeys(schedule.dueDate, today) <= 0
  };
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function compareDateKeys(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function daysBetween(earlier: string, later: string): number {
  const earlierDate = new Date(`${earlier}T00:00:00`);
  const laterDate = new Date(`${later}T00:00:00`);
  return Math.floor((laterDate.getTime() - earlierDate.getTime()) / 86_400_000);
}

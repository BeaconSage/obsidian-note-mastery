export interface NoteMasterySettings {
  ignoredGlobs: string[];
  lowMasteryThreshold: number;
  language: "auto" | "en" | "zh";
  showCurrentNoteStatusBar: boolean;
}

export interface SrSchedule {
  dueDate: string;
  intervalDays: number;
  ease: number;
}

export interface ParsedFlashcardDocument {
  hasFlashcardTag: boolean;
  cardDefinitionCount: number;
  schedules: SrSchedule[];
  warnings: string[];
}

export interface CardMastery {
  schedule: SrSchedule;
  mastery: number;
  isDue: boolean;
}

export interface NoteMasteryStats {
  path: string;
  basename: string;
  totalCards: number;
  reviewedCards: number;
  dueCards: number;
  averageInterval: number | null;
  averageEase: number | null;
  nextDueDate: string | null;
  mastery: number;
  warnings: string[];
}

export interface DependencyStatus {
  installed: boolean;
  version: string | null;
  dataStore: string | null;
}

import type { NoteMasterySettings } from "./types";

export const VIEW_TYPE_NOTE_MASTERY = "note-mastery-view";
export const PLUGIN_ID = "note-mastery";
export const SPACED_REPETITION_PLUGIN_ID = "obsidian-spaced-repetition";

export const DEFAULT_SETTINGS: NoteMasterySettings = {
  ignoredGlobs: ["模板/**", ".workbuddy/**"],
  lowMasteryThreshold: 60,
  language: "auto",
  showCurrentNoteStatusBar: true
};

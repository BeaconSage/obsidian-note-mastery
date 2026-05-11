import type { I18nStrings } from "./types";

const en: I18nStrings = {
  pluginName: "Note Mastery",
  dashboardTitle: "Note Mastery",
  refresh: "Refresh",
  searchPlaceholder: "Search notes...",
  filterAll: "All",
  filterLow: "Low mastery",
  filterDue: "Due",
  filterUnreviewed: "Unreviewed",
  summaryNotes: "Notes",
  summaryAverageMastery: "Avg mastery",
  summaryDueCards: "Due cards",
  summaryUnreviewed: "Unreviewed",
  tableNote: "Note",
  tableMastery: "Mastery",
  tableCards: "Cards",
  tableReviewed: "Reviewed",
  tableDue: "Due",
  tableAverageInterval: "Avg int.",
  tableAverageEase: "Avg ease",
  tableNextDue: "Next due",
  emptyState: "No matching flashcard notes found.",
  settingsTitle: "Note Mastery",
  settingsIgnoredPaths: "Ignored paths",
  settingsIgnoredPathsDesc: "One glob per line. Matching notes are excluded from the mastery dashboard.",
  settingsIgnoredPathsPlaceholder: "模板/**\n.workbuddy/**",
  settingsLowMastery: "Low mastery threshold",
  settingsLowMasteryDesc: "Percentage used by the Low mastery filter.",
  settingsLanguage: "Language",
  settingsLanguageDesc: "Auto follows Obsidian's language. You can also force English or Chinese.",
  dependencyTextInstalled: (version, dataStore) =>
    `Spaced Repetition detected${version ? ` v${version}` : ""}${dataStore ? `, dataStore: ${dataStore}` : ""}.`,
  dependencyTextMissing: "Spaced Repetition not detected. Existing SR comments can still be parsed, but no new review data will be created.",
  installNote: "Dependency: install and use the Spaced Repetition community plugin. Note Mastery only reads SR comments; it does not review cards.",
  noticeRefreshFailed: "Note Mastery: failed to refresh stats.",
  noticeFileNotFound: "Note Mastery: file not found",
  commandOpenDashboard: "Open Note Mastery dashboard",
  commandRefreshIndex: "Refresh Note Mastery index"
};

export default en;

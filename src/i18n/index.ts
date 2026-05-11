import type { App } from "obsidian";
import en from "./en";
import zh from "./zh";
import type { I18nStrings, LanguageKey } from "./types";

export type { I18nStrings, LanguageKey } from "./types";

export function resolveLanguage(_app: App, setting: LanguageKey, locale = getObsidianLocale()): "en" | "zh" {
  if (setting === "en" || setting === "zh") {
    return setting;
  }

  return locale.startsWith("zh") ? "zh" : "en";
}

export function getStrings(app: App, setting: LanguageKey): I18nStrings {
  return resolveLanguage(app, setting) === "zh" ? zh : en;
}

export function getObsidianLocale(): string {
  try {
    return document.documentElement.lang.toLowerCase() || "en";
  } catch {
    return "en";
  }
}

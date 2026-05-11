import { PluginSettingTab, Setting, type App } from "obsidian";
import { getStrings } from "./i18n";
import type NoteMasteryPlugin from "./main";

export class NoteMasterySettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: NoteMasteryPlugin) {
    super(app, plugin);
  }

  display(): void {
    const strings = getStrings(this.app, this.plugin.settings.language);
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl).setName(strings.settingsTitle).setHeading();

    const dependency = containerEl.createDiv({ cls: "note-mastery-settings-dependency" });
    dependency.setText(strings.installNote);

    new Setting(containerEl)
      .setName(strings.settingsIgnoredPaths)
      .setDesc(strings.settingsIgnoredPathsDesc)
      .addTextArea((text) => {
        text
          .setPlaceholder(strings.settingsIgnoredPathsPlaceholder)
          .setValue(this.plugin.settings.ignoredGlobs.join("\n"))
          .onChange(async (value) => {
            this.plugin.settings.ignoredGlobs = value
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean);
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 5;
        text.inputEl.addClass("note-mastery-settings-textarea");
    });

    new Setting(containerEl)
      .setName(strings.settingsLowMastery)
      .setDesc(strings.settingsLowMasteryDesc)
      .addSlider((slider) => {
        slider
          .setLimits(1, 100, 1)
          .setValue(this.plugin.settings.lowMasteryThreshold)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.lowMasteryThreshold = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(strings.settingsLanguage)
      .setDesc(strings.settingsLanguageDesc)
      .addDropdown((dropdown) => {
        dropdown
          .addOption("auto", "Auto")
          .addOption("en", "English")
          .addOption("zh", "中文")
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value as "auto" | "en" | "zh";
            await this.plugin.saveSettings();
            this.display();
          });
      });

    new Setting(containerEl)
      .setName(strings.settingsShowCurrentNoteStatusBar)
      .setDesc(strings.settingsShowCurrentNoteStatusBarDesc)
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.showCurrentNoteStatusBar)
          .onChange(async (value) => {
            this.plugin.settings.showCurrentNoteStatusBar = value;
            await this.plugin.saveSettings();
          });
      });
  }
}

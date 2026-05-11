import { Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, VIEW_TYPE_NOTE_MASTERY } from "./constants";
import { NoteMasteryIndexer } from "./indexer";
import { getStrings } from "./i18n";
import { NoteMasterySettingTab } from "./settings";
import { NoteMasteryView } from "./view";
import type { DependencyStatus, NoteMasterySettings, NoteMasteryStats } from "./types";

export default class NoteMasteryPlugin extends Plugin {
  settings: NoteMasterySettings = DEFAULT_SETTINGS;
  private statsCache: NoteMasteryStats[] = [];
  private indexer: NoteMasteryIndexer | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.indexer = new NoteMasteryIndexer(this.app, this.settings);
    const strings = getStrings(this.app, this.settings.language);

    this.registerView(
      VIEW_TYPE_NOTE_MASTERY,
      (leaf: WorkspaceLeaf) => new NoteMasteryView(leaf, this)
    );

    this.addRibbonIcon("bar-chart-3", strings.commandOpenDashboard, () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-note-mastery",
      name: strings.commandOpenDashboard,
      callback: () => {
        void this.activateView();
      }
    });

    this.addCommand({
      id: "refresh-note-mastery",
      name: strings.commandRefreshIndex,
      callback: async () => {
        await this.refreshStats();
      }
    });

    this.registerEvent(this.app.vault.on("modify", () => {
      this.debouncedRefresh();
    }));
    this.registerEvent(this.app.vault.on("delete", () => {
      this.debouncedRefresh();
    }));
    this.registerEvent(this.app.vault.on("rename", () => {
      this.debouncedRefresh();
    }));

    this.addSettingTab(new NoteMasterySettingTab(this.app, this));
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_NOTE_MASTERY);
  }

  async activateView(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_NOTE_MASTERY);
    let leaf: WorkspaceLeaf | null = leaves[0] ?? null;

    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: VIEW_TYPE_NOTE_MASTERY, active: true });
    }

    if (leaf) {
      this.app.workspace.revealLeaf(leaf);
    }
  }

  async refreshStats(): Promise<NoteMasteryStats[]> {
    this.statsCache = await this.getIndexer().buildIndex();
    return this.statsCache;
  }

  async openNote(path: string): Promise<void> {
    await this.getIndexer().openNote(path);
  }

  async getDependencyStatus(): Promise<DependencyStatus> {
    return this.getIndexer().getDependencyStatus();
  }

  getLowMasteryThreshold(): number {
    return this.settings.lowMasteryThreshold;
  }

  getLanguage(): "auto" | "en" | "zh" {
    return this.settings.language;
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.indexer = new NoteMasteryIndexer(this.app, this.settings);
  }

  private getIndexer(): NoteMasteryIndexer {
    if (!this.indexer) {
      this.indexer = new NoteMasteryIndexer(this.app, this.settings);
    }
    return this.indexer;
  }

  private debouncedRefresh = debounceAsync(async () => {
    await this.refreshStats();
  }, 1000);
}

function debounceAsync(callback: () => Promise<void>, delayMs: number): () => void {
  let timeout: number | null = null;
  return () => {
    if (timeout !== null) {
      window.clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      void callback();
    }, delayMs);
  };
}

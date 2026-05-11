import { Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
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
  private statusBarEl: HTMLElement | null = null;
  private currentNoteMastery = "";

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
      id: "open-dashboard",
      name: strings.commandOpenDashboard,
      callback: () => {
        void this.activateView();
      }
    });

    this.addCommand({
      id: "refresh-index",
      name: strings.commandRefreshIndex,
      callback: async () => {
        await this.refreshStats();
      }
    });

    this.addCommand({
      id: "show-current-note",
      name: strings.commandShowCurrentNoteMastery,
      callback: async () => {
        await this.updateCurrentNoteMastery();
        if (this.currentNoteMastery) {
          this.showStatusMessage(this.currentNoteMastery);
        }
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
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
      void this.updateCurrentNoteMastery();
    }));

    this.statusBarEl = this.addStatusBarItem();
    this.statusBarEl.addClass("note-mastery-status");
    this.statusBarEl.setAttr("aria-label", strings.commandShowCurrentNoteMastery);
    this.statusBarEl.addEventListener("click", () => {
      void this.updateCurrentNoteMastery();
      if (this.currentNoteMastery) {
        this.showStatusMessage(this.currentNoteMastery);
      }
    });

    this.addSettingTab(new NoteMasterySettingTab(this.app, this));
    this.applyStatusBarVisibility();
    void this.updateCurrentNoteMastery();
  }

  async activateView(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_NOTE_MASTERY);
    let leaf: WorkspaceLeaf | null = leaves[0] ?? null;

    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: VIEW_TYPE_NOTE_MASTERY, active: true });
    }

    if (leaf) {
      void this.app.workspace.revealLeaf(leaf);
    }
  }

  async refreshStats(): Promise<NoteMasteryStats[]> {
    this.statsCache = await this.getIndexer().buildIndex();
    void this.updateCurrentNoteMastery();
    return this.statsCache;
  }

  async openNote(path: string): Promise<void> {
    await this.getIndexer().openNote(path);
  }

  async updateCurrentNoteMastery(): Promise<void> {
    const strings = getStrings(this.app, this.settings.language);
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile)) {
      this.currentNoteMastery = strings.currentNoteNoActive;
      this.renderCurrentNoteMastery();
      return;
    }

    const mastery = await this.getIndexer().getNoteMastery(file.path);
    if (!mastery) {
      this.currentNoteMastery = `${strings.currentNoteLabel}: ${file.basename} - ${strings.currentNoteNoMastery}`;
      this.renderCurrentNoteMastery();
      return;
    }

    this.currentNoteMastery = `${strings.currentNoteLabel}: ${file.basename} ${Math.round(mastery.mastery * 100)}%`;
    this.renderCurrentNoteMastery();
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
    this.applyStatusBarVisibility();
    void this.updateCurrentNoteMastery();
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

  private renderCurrentNoteMastery(): void {
    if (!this.statusBarEl) {
      return;
    }
    if (!this.settings.showCurrentNoteStatusBar) {
      return;
    }
    this.statusBarEl.setText(this.currentNoteMastery);
  }

  private applyStatusBarVisibility(): void {
    if (!this.statusBarEl) {
      return;
    }

    this.statusBarEl.style.display = this.settings.showCurrentNoteStatusBar ? "" : "none";
    if (this.settings.showCurrentNoteStatusBar) {
      this.renderCurrentNoteMastery();
    }
  }

  private showStatusMessage(message: string): void {
    new Notice(message, 2000);
  }
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

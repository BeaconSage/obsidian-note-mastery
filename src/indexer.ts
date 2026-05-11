import { Notice, TFile, type App } from "obsidian";
import { SPACED_REPETITION_PLUGIN_ID } from "./constants";
import { matchesAnyGlob } from "./glob";
import { calculateNoteMastery, toDateKey } from "./mastery";
import { parseFlashcardDocument } from "./parser";
import type { DependencyStatus, NoteMasterySettings, NoteMasteryStats } from "./types";

interface SpacedRepetitionData {
  settings?: {
    dataStore?: string;
  };
}

interface SpacedRepetitionManifest {
  version?: string;
}

export class NoteMasteryIndexer {
  constructor(
    private readonly app: App,
    private readonly settings: NoteMasterySettings
  ) {}

  async buildIndex(): Promise<NoteMasteryStats[]> {
    const today = toDateKey(new Date());
    const files = this.app.vault.getMarkdownFiles();
    const stats: NoteMasteryStats[] = [];

    for (const file of files) {
      if (matchesAnyGlob(file.path, this.settings.ignoredGlobs)) {
        continue;
      }

      const parsed = parseFlashcardDocument(await this.app.vault.cachedRead(file));
      if (!parsed.hasFlashcardTag && parsed.schedules.length === 0) {
        continue;
      }

      stats.push(calculateNoteMastery(file.path, file.basename, parsed, today));
    }

    return stats.sort((left, right) => left.mastery - right.mastery || left.path.localeCompare(right.path));
  }

  async getNoteMastery(path: string): Promise<NoteMasteryStats | null> {
    if (matchesAnyGlob(path, this.settings.ignoredGlobs)) {
      return null;
    }

    const abstractFile = this.app.vault.getAbstractFileByPath(path);
    if (!(abstractFile instanceof TFile)) {
      return null;
    }

    const parsed = parseFlashcardDocument(await this.app.vault.cachedRead(abstractFile));
    if (!parsed.hasFlashcardTag && parsed.schedules.length === 0) {
      return null;
    }

    return calculateNoteMastery(abstractFile.path, abstractFile.basename, parsed, toDateKey(new Date()));
  }

  async openNote(path: string): Promise<void> {
    const abstractFile = this.app.vault.getAbstractFileByPath(path);
    if (!(abstractFile instanceof TFile)) {
      new Notice(`Note Mastery: file not found: ${path}`);
      return;
    }
    await this.app.workspace.getLeaf(false).openFile(abstractFile);
  }

  async getDependencyStatus(): Promise<DependencyStatus> {
    const pluginDir = `.obsidian/plugins/${SPACED_REPETITION_PLUGIN_ID}`;
    const manifestPath = `${pluginDir}/manifest.json`;
    const dataPath = `${pluginDir}/data.json`;
    const adapter = this.app.vault.adapter;

    const manifestExists = await adapter.exists(manifestPath);
    if (!manifestExists) {
      return { installed: false, version: null, dataStore: null };
    }

    const manifest = await readJson<SpacedRepetitionManifest>(adapter, manifestPath);
    const data = await readJson<SpacedRepetitionData>(adapter, dataPath);

    return {
      installed: true,
      version: manifest?.version ?? null,
      dataStore: data?.settings?.dataStore ?? null
    };
  }
}

async function readJson<T>(adapter: App["vault"]["adapter"], path: string): Promise<T | null> {
  try {
    if (!(await adapter.exists(path))) {
      return null;
    }
    return JSON.parse(await adapter.read(path)) as T;
  } catch {
    return null;
  }
}

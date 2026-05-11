import { ItemView, Notice, WorkspaceLeaf, setIcon } from "obsidian";
import { VIEW_TYPE_NOTE_MASTERY } from "./constants";
import { getStrings } from "./i18n";
import type { DependencyStatus, NoteMasteryStats } from "./types";

type FilterMode = "all" | "low" | "due" | "unreviewed";
type SortKey = "mastery" | "path" | "totalCards" | "reviewedCards" | "dueCards" | "averageInterval" | "averageEase" | "nextDueDate";

export interface NoteMasteryViewHost {
  refreshStats(): Promise<NoteMasteryStats[]>;
  openNote(path: string): Promise<void>;
  getDependencyStatus(): Promise<DependencyStatus>;
  getLowMasteryThreshold(): number;
  getLanguage(): "auto" | "en" | "zh";
}

export class NoteMasteryView extends ItemView {
  private stats: NoteMasteryStats[] = [];
  private filterMode: FilterMode = "all";
  private query = "";
  private sortKey: SortKey = "mastery";
  private sortDirection: 1 | -1 = 1;
  private tableContainer: HTMLElement | null = null;
  private summaryContainer: HTMLElement | null = null;
  private dependencyContainer: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf, private readonly host: NoteMasteryViewHost) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_NOTE_MASTERY;
  }

  getDisplayText(): string {
    return this.strings().dashboardTitle;
  }

  getIcon(): string {
    return "bar-chart-3";
  }

  async onOpen(): Promise<void> {
    const strings = this.strings();
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("note-mastery-view");

    const header = containerEl.createDiv({ cls: "note-mastery-header" });
    const title = header.createDiv({ cls: "note-mastery-title", text: strings.dashboardTitle });
    setIcon(title.createSpan({ cls: "note-mastery-title-icon" }), "bar-chart-3");

    const refreshButton = header.createEl("button", { cls: "mod-cta note-mastery-refresh", text: strings.refresh });
    refreshButton.addEventListener("click", () => {
      void this.refresh();
    });

    this.dependencyContainer = containerEl.createDiv({ cls: "note-mastery-dependency" });
    this.summaryContainer = containerEl.createDiv({ cls: "note-mastery-summary" });

    const controls = containerEl.createDiv({ cls: "note-mastery-controls" });
    const search = controls.createEl("input", {
      type: "search",
      placeholder: strings.searchPlaceholder,
      cls: "note-mastery-search"
    });
    search.addEventListener("input", () => {
      this.query = search.value.toLowerCase();
      this.renderTable();
    });

    const filter = controls.createEl("select", { cls: "note-mastery-filter" });
    for (const [value, label] of [
      ["all", strings.filterAll],
      ["low", strings.filterLow],
      ["due", strings.filterDue],
      ["unreviewed", strings.filterUnreviewed]
    ] as Array<[FilterMode, string]>) {
      filter.createEl("option", { value, text: label });
    }
    filter.addEventListener("change", () => {
      this.filterMode = filter.value as FilterMode;
      this.renderTable();
    });

    this.tableContainer = containerEl.createDiv({ cls: "note-mastery-table-container" });
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const strings = this.strings();
    try {
      this.renderDependency(await this.host.getDependencyStatus());
      this.stats = await this.host.refreshStats();
      this.renderSummary();
      this.renderTable();
    } catch (error) {
      console.error(error);
      new Notice(strings.noticeRefreshFailed);
    }
  }

  private renderDependency(status: DependencyStatus): void {
    if (!this.dependencyContainer) {
      return;
    }
    const strings = this.strings();
    this.dependencyContainer.empty();
    const stateClass = status.installed ? "is-ok" : "is-warning";
    this.dependencyContainer.addClass(stateClass);
    this.dependencyContainer.removeClass(status.installed ? "is-warning" : "is-ok");
    const text = status.installed
      ? strings.dependencyTextInstalled(status.version, status.dataStore)
      : strings.dependencyTextMissing;
    this.dependencyContainer.setText(text);
  }

  private renderSummary(): void {
    if (!this.summaryContainer) {
      return;
    }
    const strings = this.strings();
    this.summaryContainer.empty();
    const noteCount = this.stats.length;
    const dueCards = this.stats.reduce((sum, stat) => sum + stat.dueCards, 0);
    const unreviewedCards = this.stats.reduce((sum, stat) => sum + Math.max(0, stat.totalCards - stat.reviewedCards), 0);
    const averageMastery = noteCount === 0
      ? 0
      : this.stats.reduce((sum, stat) => sum + stat.mastery, 0) / noteCount;

    for (const item of [
      [strings.summaryNotes, String(noteCount)],
      [strings.summaryAverageMastery, formatPercent(averageMastery)],
      [strings.summaryDueCards, String(dueCards)],
      [strings.summaryUnreviewed, String(unreviewedCards)]
    ]) {
      const card = this.summaryContainer.createDiv({ cls: "note-mastery-summary-card" });
      card.createDiv({ cls: "note-mastery-summary-value", text: item[1] });
      card.createDiv({ cls: "note-mastery-summary-label", text: item[0] });
    }
  }

  private renderTable(): void {
    if (!this.tableContainer) {
      return;
    }
    const strings = this.strings();
    this.tableContainer.empty();

    const rows = this.filteredStats();
    if (rows.length === 0) {
      this.tableContainer.createDiv({ cls: "note-mastery-empty", text: strings.emptyState });
      return;
    }

    const table = this.tableContainer.createEl("table", { cls: "note-mastery-table" });
    const colgroup = table.createEl("colgroup");
    for (const column of this.columns(strings)) {
      colgroup.createEl("col", { cls: `note-mastery-col-${column.key}` });
    }

    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    for (const column of this.columns(strings)) {
      const th = headerRow.createEl("th");
      const button = th.createEl("button", { text: column.label });
      button.addEventListener("click", () => {
        this.updateSort(column.key);
        this.renderTable();
      });
    }

    const tbody = table.createEl("tbody");
    for (const stat of rows) {
      const row = tbody.createEl("tr");
      row.addEventListener("click", () => {
        void this.host.openNote(stat.path);
      });
      row.createEl("td", { text: stat.basename, title: stat.path });
      row.createEl("td", { text: formatPercent(stat.mastery) });
      row.createEl("td", { text: String(stat.totalCards) });
      row.createEl("td", { text: String(stat.reviewedCards) });
      row.createEl("td", { text: String(stat.dueCards) });
      row.createEl("td", { text: formatNullable(stat.averageInterval, 1) });
      row.createEl("td", { text: formatNullable(stat.averageEase, 0) });
      row.createEl("td", { text: stat.nextDueDate ?? "-" });
    }
  }

  private filteredStats(): NoteMasteryStats[] {
    const lowThreshold = this.host.getLowMasteryThreshold() / 100;
    return [...this.stats]
      .filter((stat) => {
        const matchesQuery = this.query.length === 0
          || stat.basename.toLowerCase().includes(this.query)
          || stat.path.toLowerCase().includes(this.query);
        if (!matchesQuery) {
          return false;
        }
        if (this.filterMode === "low") {
          return stat.mastery < lowThreshold;
        }
        if (this.filterMode === "due") {
          return stat.dueCards > 0;
        }
        if (this.filterMode === "unreviewed") {
          return stat.reviewedCards < stat.totalCards;
        }
        return true;
      })
      .sort((left, right) => this.compareStats(left, right));
  }

  private updateSort(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 1 ? -1 : 1;
    } else {
      this.sortKey = key;
      this.sortDirection = 1;
    }
  }

  private compareStats(left: NoteMasteryStats, right: NoteMasteryStats): number {
    const leftValue = left[this.sortKey];
    const rightValue = right[this.sortKey];
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * this.sortDirection;
    }
    return String(leftValue ?? "").localeCompare(String(rightValue ?? "")) * this.sortDirection;
  }

  private strings() {
    return getStrings(this.app, this.host.getLanguage());
  }

  private columns(strings: ReturnType<typeof getStrings>): Array<{ key: SortKey; label: string }> {
    return [
      { key: "path", label: strings.tableNote },
      { key: "mastery", label: strings.tableMastery },
      { key: "totalCards", label: strings.tableCards },
      { key: "reviewedCards", label: strings.tableReviewed },
      { key: "dueCards", label: strings.tableDue },
      { key: "averageInterval", label: strings.tableAverageInterval },
      { key: "averageEase", label: strings.tableAverageEase },
      { key: "nextDueDate", label: strings.tableNextDue }
    ];
  }
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatNullable(value: number | null, digits: number): string {
  return value === null ? "-" : value.toFixed(digits);
}

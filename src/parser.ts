import type { ParsedFlashcardDocument, SrSchedule } from "./types";

const SR_COMMENT_REGEX = /<!--\s*SR:([^>]*)-->/g;
const SR_SEGMENT_REGEX = /!([0-9]{4}-[0-9]{2}-[0-9]{2}),(\d+),(\d+)/g;

export function parseFlashcardDocument(markdown: string): ParsedFlashcardDocument {
  const warnings: string[] = [];
  const schedules = parseSrSchedules(markdown, warnings);
  const hasFlashcardTag = /(^|\s)#flashcards(?:\/[\p{L}\p{N}_/-]+)?/mu.test(markdown);
  const cardDefinitionCount = estimateCardDefinitionCount(markdown);

  return {
    hasFlashcardTag,
    cardDefinitionCount,
    schedules,
    warnings
  };
}

export function parseSrSchedules(markdown: string, warnings: string[] = []): SrSchedule[] {
  const schedules: SrSchedule[] = [];
  let commentMatch: RegExpExecArray | null;

  while ((commentMatch = SR_COMMENT_REGEX.exec(markdown)) !== null) {
    const body = commentMatch[1] ?? "";
    let segmentMatch: RegExpExecArray | null;
    let foundSegment = false;
    SR_SEGMENT_REGEX.lastIndex = 0;

    while ((segmentMatch = SR_SEGMENT_REGEX.exec(body)) !== null) {
      foundSegment = true;
      schedules.push({
        dueDate: segmentMatch[1],
        intervalDays: Number(segmentMatch[2]),
        ease: Number(segmentMatch[3])
      });
    }

    if (!foundSegment) {
      warnings.push(`Unrecognized SR comment: <!--SR:${body}-->`);
    }
  }

  return schedules;
}

export function estimateCardDefinitionCount(markdown: string): number {
  const withoutCodeBlocks = stripFencedCodeBlocks(markdown);
  const lines = withoutCodeBlocks.split(/\r?\n/);
  let count = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("<!--SR:") || trimmed.startsWith("#")) {
      continue;
    }

    if (isSingleLineCard(trimmed)) {
      count += trimmed.includes(":::") ? 2 : 1;
      continue;
    }

    count += countClozeCards(trimmed);
  }

  count += countMultilineSeparators(lines);
  return count;
}

function isSingleLineCard(line: string): boolean {
  if (/^[-*+]\s+\[[ xX]\]/.test(line)) {
    return false;
  }
  if (line.startsWith("|")) {
    return false;
  }
  return line.includes("::");
}

function countClozeCards(line: string): number {
  const highlightCount = line.match(/==[^=\n]+==/g)?.length ?? 0;
  const curlyCount = line.match(/\{\{[^}\n]+\}\}/g)?.length ?? 0;
  return highlightCount + curlyCount;
}

function countMultilineSeparators(lines: string[]): number {
  let count = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "?") {
      count += 1;
    } else if (trimmed === "??") {
      count += 2;
    }
  }
  return count;
}

function stripFencedCodeBlocks(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, "");
}

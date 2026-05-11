import { describe, expect, it } from "vitest";
import { matchesAnyGlob, matchesGlob } from "../src/glob";

describe("matchesGlob", () => {
  it("matches nested template paths", () => {
    expect(matchesGlob("模板/原子知识点模板.md", "模板/**")).toBe(true);
  });

  it("does not match unrelated paths", () => {
    expect(matchesGlob("03-知识/A.md", "模板/**")).toBe(false);
  });

  it("matches any configured glob", () => {
    expect(matchesAnyGlob(".workbuddy/memory/MEMORY.md", ["模板/**", ".workbuddy/**"])).toBe(true);
  });
});

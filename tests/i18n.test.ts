import { describe, expect, it } from "vitest";
import { getStrings, resolveLanguage } from "../src/i18n";

describe("resolveLanguage", () => {
  it("uses explicit English", () => {
    expect(resolveLanguage({} as never, "en", "zh-cn")).toBe("en");
  });

  it("uses explicit Chinese", () => {
    expect(resolveLanguage({} as never, "zh", "en")).toBe("zh");
  });

  it("falls back to zh by locale", () => {
    expect(resolveLanguage({} as never, "auto", "zh-cn")).toBe("zh");
  });

  it("falls back to en by locale", () => {
    expect(resolveLanguage({} as never, "auto", "en-us")).toBe("en");
  });
});

describe("getStrings", () => {
  it("returns Chinese strings when forced", () => {
    expect(getStrings({} as never, "zh").dashboardTitle).toBe("掌握度看板");
  });

  it("returns English strings when forced", () => {
    expect(getStrings({} as never, "en").dashboardTitle).toBe("Note Mastery");
  });
});

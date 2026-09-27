import { describe, expect, it } from "vitest";
import {
  assignCoverStyles,
  hashString,
  layoutForArticle,
} from "./magazines";

function idsPreferringOverlay(count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < 10_000 && ids.length < count; i++) {
    const id = `article-${i}`;
    if (layoutForArticle(id).preferredStyle === "overlay") {
      ids.push(id);
    }
  }
  if (ids.length < count) {
    throw new Error(`Could not find ${count} overlay-preferring ids`);
  }
  return ids;
}

describe("hashString", () => {
  it("returns a stable non-negative integer for the same input", () => {
    expect(hashString("milk-before-bed")).toBe(hashString("milk-before-bed"));
    expect(hashString("test")).toBeGreaterThanOrEqual(0);
  });
});

describe("layoutForArticle", () => {
  it("returns identical layout for the same id across calls", () => {
    const first = layoutForArticle("the-moldy-peaches");
    const second = layoutForArticle("the-moldy-peaches");
    expect(second).toEqual(first);
  });

  it("keeps dimensions and lean within their intended ranges", () => {
    for (let i = 0; i < 200; i++) {
      const layout = layoutForArticle(`post-${i}`);
      expect(layout.widthWeight).toBeGreaterThanOrEqual(108);
      expect(layout.widthWeight).toBeLessThanOrEqual(175);
      expect(layout.heightScale).toBeGreaterThanOrEqual(0.9);
      expect(layout.heightScale).toBeLessThanOrEqual(1.1);
      expect(layout.leanDeg).toBeGreaterThanOrEqual(-1.5);
      expect(layout.leanDeg).toBeLessThanOrEqual(1.5);
    }
  });
});

function idsPreferring(
  style: "overlay" | "split" | "title",
  count: number,
): string[] {
  const ids: string[] = [];
  for (let i = 0; i < 10_000 && ids.length < count; i++) {
    const id = `article-${i}`;
    if (layoutForArticle(id).preferredStyle === style) {
      ids.push(id);
    }
  }
  if (ids.length < count) {
    throw new Error(`Could not find ${count} ${style}-preferring ids`);
  }
  return ids;
}

describe("assignCoverStyles", () => {
  it("avoids three consecutive overlay styles when alternatives exist", () => {
    const [a, b, c] = idsPreferringOverlay(3);
    const available = {
      [a]: ["overlay", "split", "title"] as const,
      [b]: ["overlay", "split", "title"] as const,
      [c]: ["overlay", "split", "title"] as const,
    };
    const assigned = assignCoverStyles([a, b, c], available);
    expect(assigned[a]).toBe("overlay");
    expect(assigned[b]).toBe("overlay");
    expect(assigned[c]).not.toBe("overlay");
  });

  it("avoids overlay,overlay,overlay when preferred is unavailable but overlay is chosen", () => {
    const [overlayId, splitId, titleId] = [
      idsPreferring("overlay", 1)[0]!,
      idsPreferring("split", 1)[0]!,
      idsPreferring("title", 1)[0]!,
    ];
    const available = {
      [overlayId]: ["overlay", "split", "title"] as const,
      [splitId]: ["overlay", "title"] as const,
      [titleId]: ["overlay", "split"] as const,
    };
    const assigned = assignCoverStyles([overlayId, splitId, titleId], available);
    expect(assigned[overlayId]).toBe("overlay");
    expect(assigned[splitId]).toBe("overlay");
    expect(assigned[titleId]).not.toBe("overlay");
  });
});

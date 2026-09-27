import { describe, expect, it } from "vitest";
import { resolveCover, type CoverManifestEntry } from "./covers";
import type { Article } from "./types";

const article: Article = {
  id: "milk-before-bed",
  postId: "200366338",
  title: "Milk before bed",
  subtitle: null,
  date: "2026-06-02T22:41:44.573Z",
  url: "https://pechat.substack.com/p/milk-before-bed",
  isPaid: false,
  tags: [],
  coverImage: "https://example.com/remote.jpg",
};

const manifestEntry: CoverManifestEntry = {
  id: article.id,
  postId: article.postId!,
  sourceUrl: "https://example.com/generated",
  style: "overlay",
  aspect: "grid",
  width: 720,
  height: 480,
  path: "/assets/covers/milk-before-bed.webp",
};

describe("resolveCover", () => {
  it("prefers a matching local manifest cover", () => {
    expect(resolveCover(article, [manifestEntry])).toBe(manifestEntry.path);
  });

  it("falls back to the remote article cover", () => {
    expect(resolveCover(article, [])).toBe(article.coverImage);
  });

  it("returns null when neither cover is available", () => {
    expect(resolveCover({ ...article, coverImage: null }, [])).toBeNull();
  });
});

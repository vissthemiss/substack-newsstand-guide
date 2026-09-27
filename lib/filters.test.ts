import { describe, expect, it } from "vitest";
import { collectTopics, filterArticles, sortArticles } from "./filters";
import type { Article } from "./types";

const makeArticle = (overrides: Partial<Article> & { id: string }): Article => ({
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  subtitle: null,
  date: overrides.date ?? "2026-01-10T00:00:00.000Z",
  url: `https://pechat.substack.com/p/${overrides.id}`,
  isPaid: false,
  tags: overrides.tags ?? [],
  coverImage: null,
});

describe("collectTopics", () => {
  it("returns sorted unique tags and does not invent General", () => {
    const articles = [
      makeArticle({ id: "a", tags: ["music"] }),
      makeArticle({ id: "b", tags: ["art", "music"] }),
      makeArticle({ id: "c", tags: [] }),
    ];
    expect(collectTopics(articles)).toEqual(["art", "music"]);
  });
});

describe("filterArticles", () => {
  it('returns all articles for "All"', () => {
    const articles = [
      makeArticle({ id: "a", tags: ["music"] }),
      makeArticle({ id: "b", tags: [] }),
    ];
    expect(filterArticles(articles, "All")).toEqual(articles);
  });

  it('matches empty tags for "General"', () => {
    const articles = [
      makeArticle({ id: "a", tags: ["music"] }),
      makeArticle({ id: "b", tags: [] }),
      makeArticle({ id: "c", tags: [] }),
    ];
    expect(filterArticles(articles, "General").map((a) => a.id)).toEqual([
      "b",
      "c",
    ]);
  });

  it("filters by tag", () => {
    const articles = [
      makeArticle({ id: "a", tags: ["music"] }),
      makeArticle({ id: "b", tags: ["art"] }),
    ];
    expect(filterArticles(articles, "music").map((a) => a.id)).toEqual(["a"]);
  });
});

describe("sortArticles", () => {
  it('sorts by date descending for "new"', () => {
    const articles = [
      makeArticle({ id: "old", date: "2026-01-01T00:00:00.000Z" }),
      makeArticle({ id: "new", date: "2026-01-10T00:00:00.000Z" }),
    ];
    expect(sortArticles(articles, "new", []).map((a) => a.id)).toEqual([
      "new",
      "old",
    ]);
  });

  it('uses orderByPopularity for "top"', () => {
    const arts = (ids: string[]): Article[] =>
      ids.map((id, i) => ({
        id,
        title: id,
        subtitle: null,
        date: `2026-01-${String(10 - i).padStart(2, "0")}T00:00:00.000Z`,
        url: `https://pechat.substack.com/p/${id}`,
        isPaid: false,
        tags: [],
        coverImage: null,
      }));
    const articles = arts(["a", "b", "c", "d"]);
    expect(sortArticles(articles, "top", ["c", "a"]).map((x) => x.id)).toEqual([
      "c",
      "a",
      "b",
      "d",
    ]);
  });
});

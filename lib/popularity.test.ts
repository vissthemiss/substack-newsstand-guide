import { describe, expect, it } from "vitest";
import { orderByPopularity } from "./popularity";
import type { Article } from "./types";

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

describe("orderByPopularity", () => {
  it("follows ranked ids then appends missing newest-first", () => {
    // arts() dates: index 0 newest (Jan 10), then Jan 9, Jan 8, Jan 7
    const articles = arts(["a", "b", "c", "d"]);
    const ordered = orderByPopularity(articles, ["c", "a"]);
    // ranked c, a; missing b (Jan 9) before d (Jan 7)
    expect(ordered.map((x) => x.id)).toEqual(["c", "a", "b", "d"]);
  });
});

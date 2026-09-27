import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchArchivePage,
  fetchCompleteArchive,
  getArticles,
  loadArchiveSnapshot,
} from "./substack";

function post(id: number, slug = `post-${id}`) {
  return {
    id,
    slug,
    title: `Post ${id}`,
    subtitle: null,
    post_date: `2026-09-${String(id).padStart(2, "0")}T12:00:00.000Z`,
    canonical_url: `https://pechat.substack.com/p/${slug}`,
    audience: "everyone",
    cover_image: null,
    postTags: [],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchArchivePage", () => {
  it("requests the configured archive page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([post(1)]), {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchArchivePage("top", 10, 25)).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://pechat.substack.com/api/v1/archive?sort=top&offset=10&limit=25",
    );
    expect(init).toEqual({ next: { revalidate: 3600 } });
  });
});

describe("fetchCompleteArchive", () => {
  it("continues through a short page until an empty batch", async () => {
    const pages = new Map<number, unknown[]>([
      [0, [post(1), post(2)]],
      [2, [post(3)]],
      [3, []],
    ]);
    const offsets: number[] = [];
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const offset = Number(url.searchParams.get("offset"));
      offsets.push(offset);
      return new Response(JSON.stringify(pages.get(offset) ?? []));
    });
    vi.stubGlobal("fetch", fetchMock);

    const articles = await fetchCompleteArchive("new");

    expect(articles.map(({ id }) => id)).toEqual([
      "post-1",
      "post-2",
      "post-3",
    ]);
    expect(offsets).toEqual([0, 2, 3]);
    expect(
      fetchMock.mock.calls.every(([input]) => {
        const url = new URL(String(input));
        return (
          url.searchParams.get("sort") === "new" &&
          url.searchParams.get("limit") === "50"
        );
      }),
    ).toBe(true);
  });

  it("stops when a page repeats ids without progress", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([post(1), post(2)])))
      .mockResolvedValueOnce(new Response(JSON.stringify([post(1), post(2)])));
    vi.stubGlobal("fetch", fetchMock);

    const articles = await fetchCompleteArchive("new");

    expect(articles.map(({ id }) => id)).toEqual(["post-1", "post-2"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("archive fallback", () => {
  it("loads the generated snapshot", () => {
    expect(loadArchiveSnapshot()).toHaveLength(7);
  });

  it("returns the snapshot when the live request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await getArticles();

    expect(result.source).toBe("snapshot");
    expect(result.articles).toEqual(loadArchiveSnapshot());
  });

  it("returns the snapshot when the live archive is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify([]))),
    );

    await expect(getArticles()).resolves.toEqual({
      articles: loadArchiveSnapshot(),
      source: "snapshot",
    });
  });
});

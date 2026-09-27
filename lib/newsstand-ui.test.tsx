import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArticlePreviewDialog } from "@/components/ArticlePreviewDialog";
import { Magazine } from "@/components/Magazine";
import { Newsstand, rackCapacity } from "@/components/Newsstand";
import { ShelfRow } from "@/components/ShelfRow";
import type { CoverManifestEntry } from "./covers";
import { layoutForArticle } from "./magazines";
import type { Article } from "./types";

const articles: Article[] = [
  {
    id: "new-story",
    title: "New Story",
    subtitle: null,
    date: "2026-02-01T00:00:00.000Z",
    url: "https://example.com/new",
    isPaid: false,
    tags: ["Music"],
    coverImage: null,
  },
  {
    id: "general-story",
    title: "General Story",
    subtitle: null,
    date: "2026-01-01T00:00:00.000Z",
    url: "https://example.com/general",
    isPaid: false,
    tags: [],
    coverImage: null,
  },
];

describe("newsstand UI", () => {
  it("uses the required shelf capacities at each rack breakpoint", () => {
    expect([359, 360, 459, 460, 649, 650, 949, 950].map(rackCapacity)).toEqual([
      2, 3, 3, 4, 4, 7, 7, 8,
    ]);
  });

  it("renders magazines as labelled buttons and wood as decorative", () => {
    const magazine = renderToStaticMarkup(
      <Magazine article={articles[0]!} coverSrc={null} onSelect={() => {}} />,
    );
    const shelf = renderToStaticMarkup(
      <ShelfRow
        articles={articles}
        coverManifest={[]}
        rowIndex={2}
        onSelect={() => {}}
      />,
    );

    expect(magazine).toContain('aria-label="New Story"');
    expect(magazine).toContain("<button");
    expect(shelf).toContain('aria-hidden="true"');
    expect(shelf).toContain("--shelf-row:2");
  });

  it("renders topic controls including General when untagged stories exist", () => {
    const html = renderToStaticMarkup(
      <Newsstand articles={articles} rankedIds={[]} coverManifest={[]} />,
    );

    expect(html).toContain(">All<");
    expect(html).toContain(">Music<");
    expect(html).toContain(">General<");
    expect(html).toContain(">Newest<");
    expect(html).toContain(">Top reads<");
  });

  it("renders article preview details without repeating the author", () => {
    const html = renderToStaticMarkup(
      <ArticlePreviewDialog
        article={{
          ...articles[0]!,
          subtitle: "A closer look",
          isPaid: true,
          tags: ["Music", "Culture"],
          coverImage: "https://example.com/remote-cover.jpg",
        }}
        coverSrc="/assets/covers/local-cover.webp"
        onClose={() => {}}
        triggerRef={createRef<HTMLButtonElement>()}
      />,
    );

    expect(html).toContain("<dialog");
    expect(html).toContain("New Story");
    expect(html).toContain("A closer look");
    expect(html).toContain("Music");
    expect(html).toContain("Paid");
    expect(html).toContain('href="https://example.com/new"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain(">Read on Substack<");
    expect(html).toContain('src="/assets/covers/local-cover.webp"');
    expect(html).not.toContain("remote-cover.jpg");
    expect(html).not.toContain("annna zlogoni");
  });

  it("keeps repeated cover styles to two across shelf boundaries", () => {
    const overlayIds: string[] = [];
    for (let index = 0; overlayIds.length < 10; index++) {
      const id = `overlay-${index}`;
      if (layoutForArticle(id).preferredStyle === "overlay") {
        overlayIds.push(id);
      }
    }
    const shelfArticles = overlayIds.map((id, index) => ({
      ...articles[0]!,
      id,
      title: `Story ${index}`,
      date: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
    }));
    const manifest = overlayIds.flatMap((id) =>
      (["overlay", "split", "title"] as const).map(
        (style): CoverManifestEntry => ({
          id,
          postId: id,
          sourceUrl: "",
          style,
          aspect: "grid",
          width: 720,
          height: 900,
          path: `/${id}-${style}.webp`,
        }),
      ),
    );

    const html = renderToStaticMarkup(
      <Newsstand
        articles={shelfArticles}
        rankedIds={[]}
        coverManifest={manifest}
      />,
    );
    const styles = [...html.matchAll(/magazine__paper--(\w+)/g)].map(
      (match) => match[1],
    );

    for (let index = 2; index < styles.length; index++) {
      expect(new Set(styles.slice(index - 2, index + 1)).size).toBeGreaterThan(
        1,
      );
    }
  });
});

import type { Article } from "./types";

export type CoverManifestEntry = {
  id: string;
  postId: string;
  sourceUrl: string;
  style: "overlay" | "split" | "title" | "fallback";
  aspect: "grid" | "stories" | "original";
  width: number;
  height: number;
  path: string;
};

export function resolveCover(
  article: Article,
  manifest: readonly CoverManifestEntry[],
): string | null {
  return (
    manifest.find(
      (entry) =>
        entry.id === article.id ||
        (article.postId !== undefined && entry.postId === article.postId),
    )?.path ??
    article.coverImage ??
    null
  );
}

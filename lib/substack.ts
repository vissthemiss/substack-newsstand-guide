import archiveSnapshot from "../data/archive-snapshot.json";
import { dedupeArticles, normalizePost } from "./archive";
import { publication } from "./publication";
import type { Article } from "./types";

type ArchiveSort = "new" | "top";

export async function fetchArchivePage(
  sort: ArchiveSort,
  offset: number,
  limit = 50,
): Promise<unknown[]> {
  const params = new URLSearchParams({
    sort,
    offset: String(offset),
    limit: String(limit),
  });
  const response = await fetch(`${publication.archiveApiBase}?${params}`, {
    next: { revalidate: publication.revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`Substack archive request failed (${response.status})`);
  }

  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error("Substack archive response was not an array");
  }

  return body;
}

export async function fetchCompleteArchive(
  sort: ArchiveSort,
): Promise<Article[]> {
  const articles: Article[] = [];
  const seen = new Set<string>();
  let offset = 0;

  while (true) {
    const rawBatch = await fetchArchivePage(sort, offset, 50);
    if (rawBatch.length === 0) break;

    const batch = dedupeArticles(
      rawBatch
        .map(normalizePost)
        .filter((article): article is Article => article !== null),
    );
    const newArticles = batch.filter((article) => !seen.has(article.id));

    if (newArticles.length === 0) break;

    for (const article of newArticles) {
      seen.add(article.id);
      articles.push(article);
    }
    offset += rawBatch.length;
  }

  return articles;
}

export function loadArchiveSnapshot(): Article[] {
  return Array.isArray(archiveSnapshot.articles)
    ? (archiveSnapshot.articles as Article[])
    : [];
}

export async function getArticles(): Promise<{
  articles: Article[];
  source: "live" | "snapshot" | "empty";
}> {
  try {
    return {
      articles: await fetchCompleteArchive("new"),
      source: "live",
    };
  } catch {
    const articles = loadArchiveSnapshot();
    return {
      articles,
      source: articles.length > 0 ? "snapshot" : "empty",
    };
  }
}

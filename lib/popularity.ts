import popularSnapshot from "../data/popular-snapshot.json";
import { fetchCompleteArchive } from "./substack";
import type { Article } from "./types";

export function orderByPopularity(
  articles: Article[],
  rankedIds: string[],
): Article[] {
  const byId = new Map(articles.map((article) => [article.id, article]));
  const ordered: Article[] = [];
  const used = new Set<string>();

  for (const id of rankedIds) {
    const article = byId.get(id);
    if (article) {
      ordered.push(article);
      used.add(id);
    }
  }

  const remaining = articles
    .filter((article) => !used.has(article.id))
    .sort((a, b) => b.date.localeCompare(a.date));

  return [...ordered, ...remaining];
}

export function loadPopularIds(): string[] {
  return Array.isArray(popularSnapshot.ids)
    ? (popularSnapshot.ids as string[])
    : [];
}

export async function getPopularIds(): Promise<string[]> {
  try {
    const articles = await fetchCompleteArchive("top");
    return articles.map((article) => article.id);
  } catch {
    return loadPopularIds();
  }
}

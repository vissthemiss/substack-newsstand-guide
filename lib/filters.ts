import { orderByPopularity } from "./popularity";
import type { Article } from "./types";

export function collectTopics(articles: Article[]): string[] {
  const topics = new Set<string>();

  for (const article of articles) {
    for (const tag of article.tags) {
      topics.add(tag);
    }
  }

  return [...topics].sort();
}

export function filterArticles(
  articles: Article[],
  topic: string | "All",
): Article[] {
  if (topic === "All") {
    return articles;
  }

  if (topic === "General") {
    return articles.filter((article) => article.tags.length === 0);
  }

  return articles.filter((article) => article.tags.includes(topic));
}

export function sortArticles(
  articles: Article[],
  mode: "new" | "top",
  rankedIds: string[],
): Article[] {
  if (mode === "top") {
    return orderByPopularity(articles, rankedIds);
  }

  return [...articles].sort((a, b) => b.date.localeCompare(a.date));
}

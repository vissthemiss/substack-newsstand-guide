import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { dedupeArticles, normalizePost } from "../lib/archive";
import { publication } from "../lib/publication";
import type { Article } from "../lib/types";

async function fetchArchivePage(offset: number): Promise<unknown[]> {
  const params = new URLSearchParams({
    sort: "new",
    offset: String(offset),
    limit: "50",
  });
  const response = await fetch(`${publication.archiveApiBase}?${params}`);

  if (!response.ok) {
    throw new Error(`Substack archive request failed (${response.status})`);
  }

  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error("Substack archive response was not an array");
  }

  return body;
}

async function fetchCompleteArchive(): Promise<Article[]> {
  const articles: Article[] = [];
  const seen = new Set<string>();
  let offset = 0;

  while (true) {
    const rawBatch = await fetchArchivePage(offset);
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

const articles = await fetchCompleteArchive();
const snapshotPath = join(process.cwd(), "data", "archive-snapshot.json");

await mkdir(dirname(snapshotPath), { recursive: true });
await writeFile(
  snapshotPath,
  `${JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      articles,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Saved ${articles.length} articles to ${snapshotPath}`);

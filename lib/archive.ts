import { publication } from "./publication";
import type { Article } from "./types";

const PAID_AUDIENCES = new Set(["only_paid", "paid"]);

function isAllowedHost(hostname: string): boolean {
  return (publication.allowedHosts as readonly string[]).includes(hostname);
}

function resolveUrl(raw: Record<string, unknown>): string | null {
  const slug = typeof raw.slug === "string" ? raw.slug : null;
  if (!slug) return null;

  const canonical =
    typeof raw.canonical_url === "string" ? raw.canonical_url : null;
  const url =
    canonical ?? `https://pechat.substack.com/p/${slug}`;

  try {
    const { hostname } = new URL(url);
    if (!isAllowedHost(hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export function normalizePost(raw: unknown): Article | null {
  if (!raw || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;
  const slug = typeof row.slug === "string" ? row.slug : null;
  const title = typeof row.title === "string" ? row.title : null;
  const date = typeof row.post_date === "string" ? row.post_date : null;

  if (!slug || !title || !date) return null;

  const url = resolveUrl(row);
  if (!url) return null;

  const postId =
    row.id !== undefined && row.id !== null ? String(row.id) : undefined;

  const audience =
    typeof row.audience === "string" ? row.audience : "";
  const isPaid = PAID_AUDIENCES.has(audience);

  const postTags = Array.isArray(row.postTags) ? row.postTags : [];
  const tags = postTags
    .map((tag) =>
      tag && typeof tag === "object" && "name" in tag
        ? (tag as { name: unknown }).name
        : null,
    )
    .filter((name): name is string => typeof name === "string");

  const subtitle =
    typeof row.subtitle === "string" ? row.subtitle : null;
  const coverImage =
    typeof row.cover_image === "string" ? row.cover_image : null;

  return {
    id: slug,
    postId,
    title,
    subtitle,
    date,
    url,
    isPaid,
    tags,
    coverImage,
  };
}

export function dedupeArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  const result: Article[] = [];

  for (const article of articles) {
    if (seen.has(article.id)) continue;
    seen.add(article.id);
    result.push(article);
  }

  return result;
}

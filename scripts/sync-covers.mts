import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import type { CoverManifestEntry } from "../lib/covers";
import type { Article } from "../lib/types";

const PUBLICATION_URL = "https://pechat.substack.com";
const CONCURRENCY = 2;
const styles = ["overlay", "split", "title"] as const;
const aspects = ["grid", "stories"] as const;

type ArchiveSnapshot = {
  articles: Article[];
};

const root = process.cwd();
const snapshotPath = join(root, "data", "archive-snapshot.json");
const manifestPath = join(root, "data", "cover-manifest.json");
const coversDirectory = join(root, "public", "assets", "covers");

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readExistingManifest(): Promise<CoverManifestEntry[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
    return Array.isArray(parsed) ? (parsed as CoverManifestEntry[]) : [];
  } catch {
    return [];
  }
}

function pressKitCandidates(postId: string, index: number) {
  const candidates = styles.flatMap((style) =>
    aspects.map((aspect) => ({
      sourceUrl:
        `${PUBLICATION_URL}/api/v1/press_kit/asset/${postId}/${style}/composed` +
        `?aspectRatio=${aspect}`,
      style,
      aspect,
    })),
  );

  const offset = index % candidates.length;
  return [...candidates.slice(offset), ...candidates.slice(0, offset)];
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      "user-agent": "uts-murmur-newsstand-cover-sync/1.0",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function writeWebp(
  input: Buffer,
  outputPath: string,
): Promise<{ width: number; height: number }> {
  const info = await sharp(input)
    .rotate()
    .resize({ width: 720 })
    .webp({ quality: 84 })
    .toFile(outputPath);

  return { width: info.width, height: info.height };
}

async function syncArticle(
  article: Article,
  index: number,
  previousByVariant: Map<string, CoverManifestEntry>,
): Promise<CoverManifestEntry[]> {
  if (!article.postId) return [];

  const candidates: Array<{
    sourceUrl: string;
    style: CoverManifestEntry["style"];
    aspect: CoverManifestEntry["aspect"];
  }> = pressKitCandidates(article.postId, index);
  const entries: CoverManifestEntry[] = [];

  for (const candidate of candidates) {
    const filename = `${article.id}-${candidate.style}-${candidate.aspect}.webp`;
    const outputPath = join(coversDirectory, filename);
    const publicPath = `/assets/covers/${filename}`;
    const variantKey = `${article.id}:${candidate.style}:${candidate.aspect}`;
    const previous = previousByVariant.get(variantKey);

    if (previous && (await fileExists(outputPath))) {
      console.log(
        `skip ${article.id} (${candidate.style}/${candidate.aspect}, cached)`,
      );
      entries.push({ ...previous, path: publicPath });
      continue;
    }

    try {
      const dimensions = await writeWebp(
        await download(candidate.sourceUrl),
        outputPath,
      );
      console.log(
        `saved ${article.id} (${candidate.style}/${candidate.aspect}, ` +
          `${dimensions.width}x${dimensions.height})`,
      );
      entries.push({
        id: article.id,
        postId: article.postId,
        sourceUrl: candidate.sourceUrl,
        style: candidate.style,
        aspect: candidate.aspect,
        ...dimensions,
        path: publicPath,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`failed ${article.id} from ${candidate.sourceUrl}: ${reason}`);
    }
  }

  if (entries.length === 0 && article.coverImage) {
    const filename = `${article.id}-fallback-original.webp`;
    const outputPath = join(coversDirectory, filename);
    const publicPath = `/assets/covers/${filename}`;
    const variantKey = `${article.id}:fallback:original`;
    const previous = previousByVariant.get(variantKey);

    if (previous && (await fileExists(outputPath))) {
      console.log(`skip ${article.id} (fallback/original, cached)`);
      entries.push({ ...previous, path: publicPath });
    } else {
      try {
        const dimensions = await writeWebp(
          await download(article.coverImage),
          outputPath,
        );
        entries.push({
          id: article.id,
          postId: article.postId,
          sourceUrl: article.coverImage,
          style: "fallback",
          aspect: "original",
          ...dimensions,
          path: publicPath,
        });
        console.log(
          `saved ${article.id} (fallback/original, ` +
            `${dimensions.width}x${dimensions.height})`,
        );
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(`failed ${article.id} fallback: ${reason}`);
      }
    }
  }

  if (entries.length === 0) {
    console.warn(`missing cover for ${article.id}`);
  }
  return entries;
}

const snapshot = JSON.parse(
  await readFile(snapshotPath, "utf8"),
) as ArchiveSnapshot;
const articles = snapshot.articles.filter((article) => article.postId);
const previous = await readExistingManifest();
const previousByVariant = new Map(
  previous.map((entry) => [
    `${entry.id}:${entry.style}:${entry.aspect}`,
    entry,
  ]),
);
const manifest: CoverManifestEntry[][] = Array.from(
  { length: articles.length },
  () => [],
);
let cursor = 0;

await mkdir(coversDirectory, { recursive: true });

async function worker() {
  while (cursor < articles.length) {
    const index = cursor++;
    manifest[index] = await syncArticle(
      articles[index],
      index,
      previousByVariant,
    );
  }
}

await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, articles.length) }, () => worker()),
);

const entries = manifest.flat();
const temporaryManifestPath = `${manifestPath}.tmp`;
await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(
  temporaryManifestPath,
  `${JSON.stringify(entries, null, 2)}\n`,
  "utf8",
);
await rename(temporaryManifestPath, manifestPath);

console.log(
  `Wrote ${entries.length} cover variants for ${articles.length} articles ` +
    `to ${manifestPath}`,
);

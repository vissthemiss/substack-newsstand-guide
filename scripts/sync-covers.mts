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
  previousById: Map<string, CoverManifestEntry>,
): Promise<CoverManifestEntry | null> {
  if (!article.postId) return null;

  const outputPath = join(coversDirectory, `${article.id}.webp`);
  const publicPath = `/assets/covers/${article.id}.webp`;
  const previous = previousById.get(article.id);

  if (previous && (await fileExists(outputPath))) {
    console.log(`skip ${article.id} (already cached)`);
    return { ...previous, path: publicPath };
  }

  const candidates: Array<{
    sourceUrl: string;
    style: CoverManifestEntry["style"];
    aspect: CoverManifestEntry["aspect"];
  }> = pressKitCandidates(article.postId, index);

  if (article.coverImage) {
    candidates.push({
      sourceUrl: article.coverImage,
      style: "fallback",
      aspect: "original",
    });
  }

  for (const candidate of candidates) {
    try {
      const dimensions = await writeWebp(
        await download(candidate.sourceUrl),
        outputPath,
      );
      console.log(
        `saved ${article.id} (${candidate.style}/${candidate.aspect}, ` +
          `${dimensions.width}x${dimensions.height})`,
      );
      return {
        id: article.id,
        postId: article.postId,
        sourceUrl: candidate.sourceUrl,
        style: candidate.style,
        aspect: candidate.aspect,
        ...dimensions,
        path: publicPath,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`failed ${article.id} from ${candidate.sourceUrl}: ${reason}`);
    }
  }

  console.warn(`missing cover for ${article.id}`);
  return null;
}

const snapshot = JSON.parse(
  await readFile(snapshotPath, "utf8"),
) as ArchiveSnapshot;
const articles = snapshot.articles.filter((article) => article.postId);
const previous = await readExistingManifest();
const previousById = new Map(previous.map((entry) => [entry.id, entry]));
const manifest: Array<CoverManifestEntry | null> = Array(articles.length).fill(
  null,
);
let cursor = 0;

await mkdir(coversDirectory, { recursive: true });

async function worker() {
  while (cursor < articles.length) {
    const index = cursor++;
    manifest[index] = await syncArticle(
      articles[index],
      index,
      previousById,
    );
  }
}

await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, articles.length) }, () => worker()),
);

const entries = manifest.filter(
  (entry): entry is CoverManifestEntry => entry !== null,
);
const temporaryManifestPath = `${manifestPath}.tmp`;
await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(
  temporaryManifestPath,
  `${JSON.stringify(entries, null, 2)}\n`,
  "utf8",
);
await rename(temporaryManifestPath, manifestPath);

console.log(
  `Wrote ${entries.length}/${articles.length} covers to ${manifestPath}`,
);

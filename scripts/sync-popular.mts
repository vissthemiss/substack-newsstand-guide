import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fetchCompleteArchive } from "../lib/substack";

const articles = await fetchCompleteArchive("top");
const ids = articles.map((article) => article.id);
const snapshotPath = join(process.cwd(), "data", "popular-snapshot.json");

await mkdir(dirname(snapshotPath), { recursive: true });
await writeFile(
  snapshotPath,
  `${JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      ids,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Saved ${ids.length} popular ids to ${snapshotPath}`);

import { Newsstand } from "@/components/Newsstand";
import { SiteIdentity } from "@/components/SiteIdentity";
import { SiteIntro } from "@/components/SiteIntro";
import { SiteNav } from "@/components/SiteNav";
import coverManifest from "@/data/cover-manifest.json";
import type { CoverManifestEntry } from "@/lib/covers";
import { getPopularIds } from "@/lib/popularity";
import { getArticles } from "@/lib/substack";

export default async function Home() {
  const [{ articles, source }, rankedIds] = await Promise.all([
    getArticles(),
    getPopularIds(),
  ]);

  console.info(`[newsstand] archive source: ${source}`);

  return (
    <>
      <SiteNav />
      <main className="page-shell">
        <SiteIdentity />
        <SiteIntro />
        {source === "empty" ? (
          <section className="newsstand" aria-labelledby="archive-error-heading">
            <p className="newsstand__eyebrow">The archive</p>
            <h2 id="archive-error-heading">Archive unavailable</h2>
            <p className="newsstand__empty">
              We couldn&apos;t load the archive right now. Please try again
              later.
            </p>
          </section>
        ) : (
          <Newsstand
            articles={articles}
            rankedIds={rankedIds}
            coverManifest={coverManifest as CoverManifestEntry[]}
          />
        )}
      </main>
    </>
  );
}

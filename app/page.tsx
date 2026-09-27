import { Newsstand } from "@/components/Newsstand";
import { SiteIdentity } from "@/components/SiteIdentity";
import { SiteIntro } from "@/components/SiteIntro";
import { SiteNav } from "@/components/SiteNav";
import archiveSnapshot from "@/data/archive-snapshot.json";
import coverManifest from "@/data/cover-manifest.json";
import popularSnapshot from "@/data/popular-snapshot.json";
import type { CoverManifestEntry } from "@/lib/covers";
import type { Article } from "@/lib/types";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="page-shell">
        <SiteIdentity />
        <SiteIntro />
        <Newsstand
          articles={archiveSnapshot.articles as Article[]}
          rankedIds={popularSnapshot.ids}
          coverManifest={coverManifest as CoverManifestEntry[]}
        />
      </main>
    </>
  );
}

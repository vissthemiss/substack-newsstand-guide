import { SiteIdentity } from "@/components/SiteIdentity";
import { SiteIntro } from "@/components/SiteIntro";
import { SiteNav } from "@/components/SiteNav";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="page-shell">
        <SiteIdentity />
        <SiteIntro />
        <p className="shelves-placeholder">Shelves coming next</p>
      </main>
    </>
  );
}

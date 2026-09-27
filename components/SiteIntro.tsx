import { publication } from "@/lib/publication";

export function SiteIntro() {
  return (
    <section className="site-intro" aria-labelledby="archive-heading">
      <h1 id="archive-heading" className="site-intro__heading">
        Browse the archive
      </h1>
      <div className="site-intro__copy">
        <p className="site-intro__tagline">{publication.tagline}</p>
        <p className="site-intro__description">{publication.description}</p>
      </div>
    </section>
  );
}

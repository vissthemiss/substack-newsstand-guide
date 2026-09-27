import { publication } from "@/lib/publication";

export function SiteIdentity() {
  return (
    <section className="site-identity" aria-labelledby="publication-author">
      {/* The supplied transparent wordmark should remain unframed and unmodified. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="site-identity__wordmark"
        src={publication.assets.wordmark}
        alt={publication.name}
      />
      <p id="publication-author" className="site-identity__author">
        {publication.author}
      </p>
    </section>
  );
}

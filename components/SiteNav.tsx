import { publication } from "@/lib/publication";

export function SiteNav() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Publication">
        <span className="site-nav__author">{publication.author}</span>
        <span className="site-nav__publication">A Substack Publication</span>
        <a className="site-nav__subscribe" href={publication.subscribeUrl}>
          Subscribe
        </a>
      </nav>
    </header>
  );
}

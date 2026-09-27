import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteIdentity } from "@/components/SiteIdentity";
import { SiteIntro } from "@/components/SiteIntro";
import { SiteNav } from "@/components/SiteNav";
import { publication } from "./publication";

describe("page chrome", () => {
  it("renders publication navigation with the configured subscription URL", () => {
    const html = renderToStaticMarkup(SiteNav());

    expect(html).toContain(publication.author);
    expect(html).toContain("A Substack Publication");
    expect(html).toContain(`href="${publication.subscribeUrl}"`);
    expect(html).toContain(">Subscribe<");
  });

  it("renders the configured transparent wordmark and author identity", () => {
    const html = renderToStaticMarkup(SiteIdentity());

    expect(html).toContain(`src="${publication.assets.wordmark}"`);
    expect(html).toContain(`alt="${publication.name}"`);
    expect(html).toContain(publication.author);
  });

  it("renders the archive invitation and configured publication copy", () => {
    const html = renderToStaticMarkup(SiteIntro());

    expect(html).toContain("Browse the archive");
    expect(html).toContain(publication.tagline);
    expect(html).toContain(publication.description);
  });
});

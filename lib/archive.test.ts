import { describe, expect, it } from "vitest";
import { dedupeArticles, normalizePost } from "./archive";

const sample = {
  id: 123,
  slug: "hello-wav",
  title: "Hello",
  subtitle: "A note",
  post_date: "2026-01-15T12:00:00.000Z",
  canonical_url: "https://pechat.substack.com/p/hello-wav",
  audience: "everyone",
  cover_image: "https://example.com/cover.jpg",
  postTags: [{ name: "music" }],
};

describe("normalizePost", () => {
  it("maps a Substack archive row to Article", () => {
    const article = normalizePost(sample);
    expect(article).toEqual({
      id: "hello-wav",
      postId: "123",
      title: "Hello",
      subtitle: "A note",
      date: "2026-01-15T12:00:00.000Z",
      url: "https://pechat.substack.com/p/hello-wav",
      isPaid: false,
      tags: ["music"],
      coverImage: "https://example.com/cover.jpg",
    });
  });

  it("rejects disallowed hosts", () => {
    expect(
      normalizePost({
        ...sample,
        canonical_url: "https://evil.example/p/x",
      }),
    ).toBeNull();
  });

  it("uses empty tags when missing (General applied at filter layer)", () => {
    const article = normalizePost({ ...sample, postTags: [] });
    expect(article?.tags).toEqual([]);
  });
});

describe("dedupeArticles", () => {
  it("keeps first occurrence per id", () => {
    const a = normalizePost(sample)!;
    const b = { ...a, title: "Other" };
    expect(dedupeArticles([a, b])).toHaveLength(1);
    expect(dedupeArticles([a, b])[0].title).toBe("Hello");
  });
});

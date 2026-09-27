import { describe, expect, it } from "vitest";
import { publication } from "./publication";

describe("publication", () => {
  it("exposes murmur identity and pechat host", () => {
    expect(publication.name).toBe("uts: murmur.");
    expect(publication.author).toBe("annna zlogoni");
    expect(publication.substackUrl).toBe("https://pechat.substack.com/");
    expect(publication.allowedHosts).toContain("pechat.substack.com");
    expect(publication.colors.page).toBe("#FFFFE8");
    expect(publication.colors.header).toBe("#AACB73");
    expect(publication.colors.accent).toBe("#CD2C58");
  });
});

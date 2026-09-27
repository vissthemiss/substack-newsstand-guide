# uts: murmur. Newsstand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a one-page Next.js magazine newsstand for [uts: murmur.](https://pechat.substack.com/) on a free Vercel URL, using real Substack archive data and covers.

**Architecture:** Next.js App Router loads cached Substack archive + popularity order (hourly revalidate) with JSON snapshot fallbacks. Client `Newsstand` handles filters, sort, shelves, and an accessible preview dialog. Covers and wood/wordmark assets live under `public/`. No Notion form.

**Tech Stack:** Next.js (App Router) + React + TypeScript + custom CSS + Vitest for `lib/` unit tests + Vercel hosting.

**Spec:** `docs/superpowers/specs/2026-09-27-uts-murmur-newsstand-design.md`  
**Guide:** `substack_newsstand_build_guide.md`

## Global Constraints

- Publication: `uts: murmur.` · Author: `annna zlogoni` · Substack: `https://pechat.substack.com/`
- Colors: page `#FFFFE8`, header `#AACB73`, accent `#CD2C58`
- Logo: wordmark only (no black plate) · Shelves: warm oak texture
- Fonts: Libre Baskerville (display) + DM Sans (UI)
- No Notion / suggestion form · No AI API keys · No invented articles or popularity scores
- Keep existing `README.md` and `substack_newsstand_build_guide.md` in the repo
- Do not commit secrets; `.env*.local` stays gitignored
- Allowed article hosts: `pechat.substack.com` (extend later if custom domain)

## File structure

```text
app/
  layout.tsx
  page.tsx
  globals.css
  opengraph-image.tsx
components/
  SiteNav.tsx
  SiteIdentity.tsx
  SiteIntro.tsx
  Newsstand.tsx          # filters, sort, shelves, dialog
  Magazine.tsx
  ShelfRow.tsx
  ArticlePreviewDialog.tsx
lib/
  publication.ts         # identity, URLs, palette, asset paths
  types.ts               # Article
  archive.ts             # normalize, paginate helpers
  substack.ts            # live fetch + cache + snapshot read
  popularity.ts          # map sort=top order + append missing
  magazines.ts           # stable hash dims + consecutive style rule
  filters.ts             # tag list + filter/sort visible articles
data/
  archive-snapshot.json
  popular-snapshot.json
  cover-manifest.json
public/assets/
  wordmark.png           # cropped murmur. mark
  worn-wood.jpg          # warm oak texture
  covers/*.webp
scripts/
  sync-snapshot.mts
  sync-popular.mts
  sync-covers.mts
vitest.config.ts
package.json
.gitignore                 # already present; extend for Next.js
README.md                  # update with run/deploy/maintenance
```

---

### Task 1: Scaffold Next.js app + publication config

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `vitest.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (placeholder)
- Create: `lib/publication.ts`, `lib/types.ts`
- Modify: `.gitignore` (add Next.js entries if missing)
- Test: `lib/publication.test.ts`

**Interfaces:**
- Produces: `Publication` config object and `Article` type used by all later tasks

- [ ] **Step 1: Scaffold the app in the repo root** (keep guide markdown files)

Run:

```bash
npx create-next-app@latest . --typescript --eslint --app --src-dir=false --tailwind=false --import-alias="@/*" --turbopack --yes
```

If create-next-app refuses a non-empty directory, manually add the same baseline files (`package.json` with `next`/`react`/`react-dom`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`) and run `npm install`.

- [ ] **Step 2: Add Vitest**

```bash
npm install -D vitest @vitejs/plugin-react jsdom
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Write failing publication test**

Create `lib/types.ts`:

```ts
export type Article = {
  id: string;
  postId?: string;
  title: string;
  subtitle: string | null;
  date: string;
  url: string;
  isPaid: boolean;
  tags: string[];
  coverImage: string | null;
};
```

Create `lib/publication.test.ts`:

```ts
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
```

- [ ] **Step 4: Run test — expect FAIL**

Run: `npm test -- lib/publication.test.ts`  
Expected: FAIL (module `./publication` missing)

- [ ] **Step 5: Implement `lib/publication.ts`**

```ts
export const publication = {
  name: "uts: murmur.",
  author: "annna zlogoni",
  tagline: "the voice behind the radio frequency",
  description:
    "Poet, radio host, curator. Thinking out loud — music, literature, all of it in wav format.",
  substackUrl: "https://pechat.substack.com/",
  subscribeUrl: "https://pechat.substack.com/subscribe",
  archiveApiBase: "https://pechat.substack.com/api/v1/archive",
  allowedHosts: ["pechat.substack.com"] as const,
  colors: {
    page: "#FFFFE8",
    header: "#AACB73",
    accent: "#CD2C58",
    text: "#1a1a1a",
  },
  assets: {
    wordmark: "/assets/wordmark.png",
    wood: "/assets/worn-wood.jpg",
  },
  revalidateSeconds: 3600,
} as const;
```

- [ ] **Step 6: Wire fonts + CSS variables in layout**

In `app/layout.tsx`, load Libre Baskerville + DM Sans via `next/font/google`, set metadata title/description from `publication`, apply CSS variables in `app/globals.css` for the palette. Placeholder `app/page.tsx` can render `{publication.name}` only.

- [ ] **Step 7: Run tests — expect PASS**

Run: `npm test`  
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts vitest.config.ts app lib .gitignore
git commit -m "chore: scaffold Next.js app and publication config"
```

---

### Task 2: Normalize Substack archive entries

**Files:**
- Create: `lib/archive.ts`, `lib/archive.test.ts`
- Modify: none required beyond imports

**Interfaces:**
- Consumes: `Article`, `publication.allowedHosts`
- Produces: `normalizePost(raw: unknown): Article | null`, `dedupeArticles(articles: Article[]): Article[]`

- [ ] **Step 1: Write failing tests**

```ts
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
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/archive.test.ts`  
Expected: FAIL (module missing)

- [ ] **Step 3: Implement `lib/archive.ts`**

Implement `normalizePost` to:
- Read `slug` as `id`, string `id`/`postId` from numeric `id` when present
- Prefer `canonical_url` then construct `https://pechat.substack.com/p/{slug}`
- Parse hostname; return `null` if not in `publication.allowedHosts`
- `isPaid` true when `audience` is `only_paid` (or equivalent paid values observed in API)
- Map `postTags[].name` to `tags`
- Coerce missing subtitle/cover to `null`

Implement `dedupeArticles` with a `Set` of ids, first wins.

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- lib/archive.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/archive.ts lib/archive.test.ts
git commit -m "feat: normalize and dedupe Substack archive posts"
```

---

### Task 3: Paginated live fetch + archive snapshot

**Files:**
- Create: `lib/substack.ts`, `lib/substack.test.ts`
- Create: `scripts/sync-snapshot.mts`
- Create: `data/archive-snapshot.json` (via script)
- Modify: `package.json` (script `sync:snapshot`)

**Interfaces:**
- Consumes: `normalizePost`, `dedupeArticles`, `publication.archiveApiBase`, `publication.revalidateSeconds`
- Produces:
  - `fetchArchivePage(sort: "new" | "top", offset: number, limit?: number): Promise<unknown[]>`
  - `fetchCompleteArchive(sort: "new" | "top"): Promise<Article[]>`
  - `loadArchiveSnapshot(): Article[]`
  - `getArticles(): Promise<{ articles: Article[]; source: "live" | "snapshot" | "empty" }>`

- [ ] **Step 1: Write pagination tests with a mock fetch**

In `lib/substack.test.ts`, mock `global.fetch` to return:
- offset 0 → 2 posts
- offset 2 → 1 post
- offset 3 → `[]`

Assert `fetchCompleteArchive("new")` returns 3 normalized articles and stops on empty batch (not on short page). Also assert loop breaks if a page repeats the same ids without progress.

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- lib/substack.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement fetch + `getArticles`**

```ts
// Core rules inside fetchCompleteArchive:
// 1. offset starts at 0
// 2. request limit 50
// 3. normalize + dedupe each batch
// 4. advance offset by raw batch length received (not only kept count)
// 5. stop on empty batch OR zero new ids after dedupe against accumulated set
```

`getArticles` should:
1. Try live `fetchCompleteArchive("new")` with Next `revalidate: publication.revalidateSeconds` on fetch
2. On success, return `{ articles, source: "live" }` (snapshot write happens in scripts, not on every request)
3. On failure, `loadArchiveSnapshot()` from `data/archive-snapshot.json`; if non-empty `{ source: "snapshot" }`, else `{ articles: [], source: "empty" }`

- [ ] **Step 4: Implement `scripts/sync-snapshot.mts`**

Node script that calls the same pagination logic (or duplicates fetch without Next cache), writes `data/archive-snapshot.json` as `{ updatedAt: ISO, articles: Article[] }` only after full success. Add npm script `"sync:snapshot": "npx tsx scripts/sync-snapshot.mts"`.

Run: `npm run sync:snapshot`  
Expected: file created; article count matches pechat archive (verify against Substack; design-time expectation was 7).

- [ ] **Step 5: Run unit tests — expect PASS**

Run: `npm test -- lib/substack.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/substack.ts lib/substack.test.ts scripts/sync-snapshot.mts data/archive-snapshot.json package.json package-lock.json
git commit -m "feat: fetch Substack archive with snapshot fallback"
```

---

### Task 4: Popularity order + filter helpers

**Files:**
- Create: `lib/popularity.ts`, `lib/popularity.test.ts`, `lib/filters.ts`, `lib/filters.test.ts`
- Create: `scripts/sync-popular.mts`, `data/popular-snapshot.json`
- Modify: `package.json` (`sync:popular`)

**Interfaces:**
- Consumes: `Article`, archive fetch helpers
- Produces:
  - `orderByPopularity(articles: Article[], rankedIds: string[]): Article[]`
  - `loadPopularIds(): string[]`
  - `getPopularIds(): Promise<string[]>`
  - `collectTopics(articles: Article[]): string[]`
  - `filterArticles(articles: Article[], topic: string | "All"): Article[]`
  - `sortArticles(articles: Article[], mode: "new" | "top", rankedIds: string[]): Article[]`

- [ ] **Step 1: Write popularity tests**

```ts
import { describe, expect, it } from "vitest";
import { orderByPopularity } from "./popularity";
import type { Article } from "./types";

const arts = (ids: string[]): Article[] =>
  ids.map((id, i) => ({
    id,
    title: id,
    subtitle: null,
    date: `2026-01-${String(10 - i).padStart(2, "0")}T00:00:00.000Z`,
    url: `https://pechat.substack.com/p/${id}`,
    isPaid: false,
    tags: [],
    coverImage: null,
  }));

describe("orderByPopularity", () => {
  it("follows ranked ids then appends missing newest-first", () => {
    // arts() dates: index 0 newest (Jan 10), then Jan 9, Jan 8, Jan 7
    const articles = arts(["a", "b", "c", "d"]);
    const ordered = orderByPopularity(articles, ["c", "a"]);
    // ranked c, a; missing b (Jan 9) before d (Jan 7)
    expect(ordered.map((x) => x.id)).toEqual(["c", "a", "b", "d"]);
  });
});
```


- [ ] **Step 2: Write filter tests**

- `collectTopics` returns sorted unique tags plus does **not** invent tags; articles with `tags: []` are matched by topic `"General"` in `filterArticles`
- `filterArticles(articles, "All")` returns all
- `sortArticles(..., "new")` sorts by date descending
- `sortArticles(..., "top", rankedIds)` uses `orderByPopularity`

- [ ] **Step 3: Implement modules + sync script**

`getPopularIds`: live `fetchCompleteArchive("top")` → map ids; on failure load `data/popular-snapshot.json`.  
`scripts/sync-popular.mts` writes `{ updatedAt, ids: string[] }`.

- [ ] **Step 4: Run tests + sync**

Run: `npm test -- lib/popularity.test.ts lib/filters.test.ts`  
Run: `npm run sync:popular`  
Expected: PASS; snapshot written

- [ ] **Step 5: Commit**

```bash
git add lib/popularity.ts lib/popularity.test.ts lib/filters.ts lib/filters.test.ts scripts/sync-popular.mts data/popular-snapshot.json package.json
git commit -m "feat: add popularity ordering and topic filters"
```

---

### Task 5: Magazine layout metrics + consecutive style rule

**Files:**
- Create: `lib/magazines.ts`, `lib/magazines.test.ts`

**Interfaces:**
- Consumes: `Article.id`
- Produces:
  - `hashString(id: string): number`
  - `layoutForArticle(id: string): { widthWeight: number; heightScale: number; leanDeg: number; preferredStyle: "overlay" | "split" | "title"; aspect: "grid" | "stories" }`
  - `assignCoverStyles(idsInOrder: string[], available: Record<string, Array<"overlay" | "split" | "title">>): Record<string, "overlay" | "split" | "title">`

- [ ] **Step 1: Write tests**

- Same id → identical layout object across calls
- `widthWeight` in 108–175, `leanDeg` in −1.5…1.5
- `assignCoverStyles`: given order A,B,C all preferring `"overlay"` with alternatives available, third assignment must not be `"overlay"` if that would create three consecutive overlays

- [ ] **Step 2: Implement**

Use a stable string hash. Map hash ranges to tall vs wide weights per guide. Walk visible order; if preferred style would make three consecutive equal styles, pick next available variant for that id.

- [ ] **Step 3: Run tests — PASS, then commit**

```bash
git add lib/magazines.ts lib/magazines.test.ts
git commit -m "feat: stable magazine dimensions and cover style variety"
```

---

### Task 6: Cover sync script + manifest

**Files:**
- Create: `scripts/sync-covers.mts`, `data/cover-manifest.json`, `public/assets/covers/` (generated)
- Modify: `package.json` (`sync:covers`)
- Modify: `lib/types.ts` or articles enrichment helper if needed

**Interfaces:**
- Produces: manifest entries `{ id, postId, sourceUrl, style, aspect, width, height, path }`
- Article `coverImage` in UI should prefer `/assets/covers/...` path when present in manifest

- [ ] **Step 1: Implement sync script**

For each article in archive snapshot with `postId`:
1. Try press-kit URLs observed in the guide:

```text
https://pechat.substack.com/api/v1/press_kit/asset/{POST_ID}/{STYLE}/composed?aspectRatio={RATIO}
```

Styles: `overlay`, `split`, `title` · Ratios: `grid`, `stories`

2. Download with low concurrency; skip existing files
3. Convert/resize to WebP ~720px wide (use `sharp` if needed: `npm install sharp`)
4. Write `data/cover-manifest.json`
5. If press-kit fails, fall back to archive `cover_image` URL once and record `style: "fallback"`

- [ ] **Step 2: Run sync**

Run: `npm run sync:covers`  
Expected: covers on disk for available posts; manifest lists paths; log any missing honestly

- [ ] **Step 3: Helper `resolveCover(article, manifest) -> string | null`**

Prefer local path; else remote `coverImage`; else `null`.

- [ ] **Step 4: Commit** (binary covers included)

```bash
git add scripts/sync-covers.mts data/cover-manifest.json public/assets/covers package.json package-lock.json lib
git commit -m "feat: sync and cache Substack cover assets"
```

---

### Task 7: Brand assets (wordmark + warm oak)

**Files:**
- Create: `public/assets/wordmark.png`, `public/assets/worn-wood.jpg`
- Optional: `scripts/prepare-wordmark.mts` notes in README if manual crop

- [ ] **Step 1: Add wordmark**

Copy the owner-supplied murmur logo from the prior Cursor assets folder (or re-upload). Crop/remove the black plate so only the `murmur.` lettering remains on transparency (or cream-friendly edge). Save as `public/assets/wordmark.png`. Alt text later: `uts: murmur. wordmark`.

- [ ] **Step 2: Add warm oak texture**

Add a licensed/owned/generated warm oak wood image to `public/assets/worn-wood.jpg` (horizontal plank suitable for CSS `background-image` with varied `background-position` per shelf row). Avoid flat solid brown.

- [ ] **Step 3: Commit**

```bash
git add public/assets/wordmark.png public/assets/worn-wood.jpg
git commit -m "assets: add murmur wordmark and warm oak shelf texture"
```

---

### Task 8: Page chrome (nav, identity, intro) + global styles

**Files:**
- Create: `components/SiteNav.tsx`, `components/SiteIdentity.tsx`, `components/SiteIntro.tsx`
- Modify: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: `publication`

- [ ] **Step 1: Implement components**

- `SiteNav`: author left, “A Substack Publication” center, Subscribe link (accent) to `publication.subscribeUrl`
- `SiteIdentity`: centered `<img>` wordmark (no black plate CSS box), author name below
- `SiteIntro`: left “Browse the archive” invitation; right tagline + description; tops aligned; stack on narrow screens

- [ ] **Step 2: Style foundation in `globals.css`**

Page background `var(--page)`, header bar `var(--header)`, accent `var(--accent)`, typography hooks for Baskerville/DM Sans, reduced-motion media query stub.

- [ ] **Step 3: Compose placeholder page**

Render nav + identity + intro above a temporary “Shelves coming next” note. Visually check desktop + ~375px width.

- [ ] **Step 4: Commit**

```bash
git add components app
git commit -m "feat: add newsstand nav, identity, and intro"
```

---

### Task 9: Shelves, magazines, filters UI

**Files:**
- Create: `components/Magazine.tsx`, `components/ShelfRow.tsx`, `components/Newsstand.tsx`
- Modify: `app/globals.css`, `app/page.tsx`

**Interfaces:**
- Consumes: `Article[]`, `rankedIds: string[]`, `coverManifest`, `filterArticles`, `sortArticles`, `layoutForArticle`, `assignCoverStyles`, `resolveCover`
- Produces: interactive newsstand (client component)

- [ ] **Step 1: `Magazine`**

Button wrapping visual layers (cover image, paper edge, lean). Hover lifts inner layer only; respect `prefers-reduced-motion`. `aria-label` = article title.

- [ ] **Step 2: `ShelfRow`**

Renders N magazines on shared baseline + warm-oak shelf (`worn-wood` background, lip/rail via CSS). `aria-hidden` on decorative wood. Vary `background-position` by row index.

- [ ] **Step 3: `Newsstand` client component**

State: `topic` (`All` | tag | `General`), `sortMode` (`new` | `top`).  
Derive visible list via `filterArticles` + `sortArticles`.  
Chunk into rows using capacities: ≥950px → 8, ≥650 → 7, ≥460 → 4, ≥360 → 3, else 2 (measure rack width with `ResizeObserver`).  
Topic chips from `collectTopics` + All; include General chip only if some article has empty tags.  
Empty filter → short message, no blank fake shelves.  
Wire magazine click to callback `onSelect(article)` (dialog in Task 10).

- [ ] **Step 4: Manual check**

`npm run dev` — filters change set; sort changes order; shelves look oak, not flat brown; ≤2 consecutive identical cover styles when variants exist.

- [ ] **Step 5: Commit**

```bash
git add components app
git commit -m "feat: render filterable magazine shelves"
```

---

### Task 10: Article preview dialog

**Files:**
- Create: `components/ArticlePreviewDialog.tsx`
- Modify: `components/Newsstand.tsx`

**Interfaces:**
- Consumes: selected `Article | null`, `onClose()`
- Produces: accessible modal with Read on Substack

- [ ] **Step 1: Implement dialog**

Use `<dialog>` with `showModal()`. On open: focus close or primary link. Escape + backdrop close. On close: restore focus to the magazine button that opened it (pass `HTMLButtonElement` ref or id). Content: cover, title, date, subtitle, topics, paid label if `isPaid`, link `Read on Substack` → `article.url` (`rel="noopener noreferrer"`). Do **not** repeat author name in the dialog body.

- [ ] **Step 2: Keyboard/touch verify**

Tab cycles inside dialog; Esc closes; mobile can open/close without hover.

- [ ] **Step 3: Commit**

```bash
git add components
git commit -m "feat: add accessible article preview dialog"
```

---

### Task 11: Server page wiring + empty/error states + OG image

**Files:**
- Modify: `app/page.tsx`
- Create: `app/opengraph-image.tsx`
- Modify: `app/layout.tsx` metadata/`metadataBase` as needed

**Interfaces:**
- Consumes: `getArticles`, `getPopularIds`, cover manifest loader

- [ ] **Step 1: Implement `app/page.tsx` as async server component**

```tsx
const { articles, source } = await getArticles();
const rankedIds = await getPopularIds();
// load cover-manifest.json
```

Pass props into `Newsstand`. If `source === "empty"`, show honest error (“Archive unavailable”) instead of shelves. If `source === "snapshot"`, optional quiet builder-only comment in HTML is unnecessary for users — skip user-facing stale banners unless desired; log source in server console for verification.

- [ ] **Step 2: `opengraph-image.tsx`**

Simple branded OG using publication name + colors (no Le Index identity).

- [ ] **Step 3: Production build**

Run: `npm run build`  
Expected: success

- [ ] **Step 4: Commit**

```bash
git add app
git commit -m "feat: wire server data loading and social preview"
```

---

### Task 12: README maintenance + deploy to Vercel

**Files:**
- Modify: `README.md`
- Optional: `vercel.json` only if needed

- [ ] **Step 1: Update README**

Document: what the site is; `npm install`, `npm run sync:snapshot`, `sync:popular`, `sync:covers`, `npm run dev`, `npm run build`; how to refresh when new Substack posts appear; that Notion is not used; deploy via Vercel + GitHub; free `*.vercel.app` URL.

- [ ] **Step 2: Push and deploy**

```bash
git add README.md
git commit -m "docs: add runbook for murmur newsstand"
git push -u origin HEAD
```

Deploy with Vercel CLI or GitHub integration (`npx vercel --prod` after login). Confirm live URL loads articles, Subscribe, and preview links.

- [ ] **Step 3: Acceptance spot-check (record results in the PR/chat)**

- Article count matches Substack  
- Tags/filters + Newest/Most popular  
- Wordmark without black plate; warm oak shelves  
- Dialog keyboard/touch; mobile widths 320/375/430 no accidental overflow  
- No Notion endpoints; no secrets in client bundle  

---

## Self-review (plan vs spec)

| Spec requirement | Task |
| --- | --- |
| Next.js + Vercel free URL | 1, 12 |
| Publication brief / colors / fonts / wordmark-only | 1, 7, 8 |
| Archive pagination + snapshot fallback | 3 |
| Popularity from `sort=top` | 4 |
| Topic filters + General | 4, 9 |
| Cover cache + consecutive style rule | 5, 6 |
| Warm oak shelves + magazine physics | 7, 9 |
| Preview dialog a11y | 10 |
| Empty/error honesty | 9, 11 |
| No Notion | omitted intentionally |
| Keep guide files | 1 (scaffold in-place) |

No TBD placeholders remain. Types (`Article`, sort modes, cover styles) are consistent across tasks.

# uts: murmur. — Substack Newsstand Design

**Date:** 2026-09-27  
**Status:** Approved for planning  
**Publication:** [uts: murmur.](https://pechat.substack.com/) by annna zlogoni  
**Repo:** [vissthemiss/substack-newsstand-guide](https://github.com/vissthemiss/substack-newsstand-guide)

## Goal

Build a one-page magazine newsstand that presents the pechat Substack archive as physical magazines on wooden shelves. Readers browse, filter, and open a preview, then continue on Substack to subscribe and read. This site does **not** restyle Substack itself.

## Publication brief (locked)

| Field | Value |
| --- | --- |
| Publication name | uts: murmur. |
| Author | annna zlogoni |
| Substack URL | https://pechat.substack.com/ |
| Tagline | the voice behind the radio frequency |
| Intro (short) | Poet, radio host, curator. Thinking out loud — music, literature, all of it in wav format. |
| Logo | Wordmark only (no black plate). Source asset: murmur logo file supplied by owner. |
| Colors | Page `#FFFFE8`, header `#AACB73`, accent `#CD2C58` |
| Reader suggestions / Notion | No |
| Hosting | Vercel free URL (`*.vercel.app`). No paid custom domain for launch. |
| GitHub | Build and push in this repository (guide files remain alongside the app). |

## Approach

**Next.js App Router + TypeScript + custom CSS on Vercel**, following `substack_newsstand_build_guide.md`.

Rejected alternatives:

- Static export / GitHub Pages — free, but weaker match to hourly archive revalidation and more redeploy friction when new posts appear.
- Minimal static HTML — fastest ship, poorest magazine-rack fidelity and harder to maintain.

## Architecture

| Piece | Responsibility |
| --- | --- |
| Main page (`/`) | Nav, identity, intro, filters/sort, shelves, preview dialog |
| Substack fetch layer | Public archive for `sort=new` and `sort=top` |
| Snapshot JSON | Complete saved fallback if live fetch fails |
| Cover cache + manifest | Local optimized WebP covers; records style, ratio, path per article |
| Preview dialog | Accessible modal → Read on Substack |
| Notion / suggestion form | Out of scope |

**Request flow:** page load → server uses cached archive (revalidate about hourly) → on live failure use snapshot → render magazines → preview → outbound Substack link.

No AI API key. No second copy of paywalled bodies. Substack remains the reading and subscribe destination.

## Data model

```ts
export type Article = {
  id: string;
  postId?: string;
  title: string;
  subtitle: string | null;
  date: string; // ISO
  url: string;
  isPaid: boolean;
  tags: string[];
  coverImage: string | null;
};
```

### Import rules

- Source: `https://pechat.substack.com/api/v1/archive?sort=…&limit=50&offset=0` (observed endpoint; verify at build time).
- Paginate until an **empty** batch; do not treat a short page as end-of-archive.
- Deduplicate by stable id; stop safely if pagination repeats without new records.
- Save a complete snapshot only after a successful full import.
- Allow article URLs on `pechat.substack.com` (and a future custom domain if the owner adds one).
- Tags come from real Substack tags only. Untagged posts use **General**. Never invent categories.
- Current archive size at design time: **7 free posts**.

### Sorting

- Default: **Newest first** (`sort=new`).
- **Most popular** uses Substack `sort=top` order mapped onto the same article set — not an invented score.
- Persist a popularity ranking fallback. Posts missing from the ranking append after ranked entries, newest first.
- Topic filters work in both sort modes and do not change the selected sort.

### Covers

- Prefer Substack share/press assets per post; cache locally; optimize (≈720px-wide WebP as a starting point).
- Derive height, width weight, and lean from a stable hash of article id (reload does not reshuffle).
- After filter + sort: never more than two consecutive matching cover layout styles; switch variant for that article when needed.
- Keep a cover manifest (article id, source URL, style, dimensions, local path).

### Failure modes

| Condition | Behavior |
| --- | --- |
| Live archive fails, snapshot exists | Serve snapshot; diagnostics note staleness |
| No live data and no snapshot | Honest empty/error state — no fabricated magazines |
| Cover missing | Approved fallback treatment; report limitation in diagnostics |
| Filter yields zero | Short empty-state message, not blank shelves |

## Visual design

### Page composition

1. **Top nav** — author left (`annna zlogoni`), “A Substack Publication” center, **Subscribe** (accent) right → pechat.substack.com  
2. **Identity** — centered **murmur.** wordmark only (no black rectangle), author name below when it strengthens identity  
3. **Intro** — small browse invitation left; tagline + short about right; tops aligned  
4. **No suggestion form**  
5. **Controls** — real topic chips + quiet Newest / Most popular dropdown above shelves  
6. **Collection** — multiple warm-oak wooden shelves with varied magazines  
7. **Preview** — larger cover, title, date, subtitle, topic, access label if paid, Read on Substack  

### Shelves

- Tone: **warm oak** (golden grain), not flat brown.
- Real wood texture with uneven grain crop per row, faded edges, soft directional shadow.
- Shelf anatomy: back rail, side pieces, shallow front lip.
- Magazines sit on a shared baseline with varied tops, thin paper edge, slight fold shadow, light lean (−1.5° to +1.5°).
- Large desktop: aim for 7–8 magazines per full shelf; fewer on smaller widths (guide breakpoints as starting points).
- No horizontal retaining wires over covers.

### Typography & motion

- Display: **Libre Baskerville** (literary serif for titles / identity support).
- UI / body: **DM Sans** (filters, nav, dialog).
- Optional small mono for catalogue details only (e.g. dates in preview).
- Do not use Inter, Roboto, Arial, or system-ui as the primary pairing.
- Logo: crop or isolate the supplied `murmur.` wordmark so the black plate is removed; keep descriptive alt text.
- Restrained hover lift; gentle preview open/close; honor `prefers-reduced-motion`.

### Mobile

- Stack intro; wrap or scroll filters accessibly; reduce magazines per shelf; keep readable type and touch targets.

## Interaction

- Entire magazine is a keyboard-accessible button; hit area stays stable while an inner layer moves on hover.
- Preview uses a native dialog (or equivalent): focus moves in, Escape closes, Tab cycles within, close restores focus to the originating magazine.
- Open/dismiss must work without hover (touch).
- Decorative wood/textures are hidden from assistive technology.
- Do not repeat the author name on every magazine preview.

## Out of scope

- Restyling pechat.substack.com itself  
- Notion suggestion form / credentials  
- Paid custom domain at launch  
- Invented popularity metrics or fake archive content  
- AI features or API keys for the newsstand  

## Success criteria

- Real titles, dates, tags, URLs, and covers for the full pechat archive  
- Filters and Newest / Most popular behave correctly  
- Warm-oak textured shelves; wordmark-only logo; publication colors applied  
- Preview + Read on Substack works on desktop and phone  
- Deployed on a free Vercel URL; GitHub remote receives the app  
- Live vs snapshot vs missing data is honest and visible to the builder during verification  

## Implementation note

Keep `README.md` and `substack_newsstand_build_guide.md` in the repo. Add the Next.js app beside them. Do not commit secrets; Vercel env vars only if needed later.

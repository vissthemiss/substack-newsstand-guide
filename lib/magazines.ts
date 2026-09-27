export type CoverStyle = "overlay" | "split" | "title";
export type Aspect = "grid" | "stories";

const STYLES: CoverStyle[] = ["overlay", "split", "title"];
const ASPECTS: Aspect[] = ["grid", "stories"];

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickRange(hash: number, min: number, max: number): number {
  return min + (hash % (max - min + 1));
}

export function layoutForArticle(id: string): {
  widthWeight: number;
  heightScale: number;
  leanDeg: number;
  preferredStyle: CoverStyle;
  aspect: Aspect;
} {
  const h = hashString(id);
  const dims = hashString(`${id}:dims`);
  const styleHash = hashString(`${id}:style`);

  const isWide = (dims & 1) === 1;
  const spread = dims >>> 1;
  const widthWeight = isWide
    ? pickRange(spread, 138, 175)
    : pickRange(spread, 108, 132);

  const leanDeg = Math.round(((h % 31) / 10 - 1.5) * 10) / 10;
  const heightScale =
    Math.round((0.92 + (((dims >>> 8) & 0xff) / 255) * 0.16) * 1000) / 1000;
  const preferredStyle = STYLES[styleHash % STYLES.length]!;
  const aspect = ASPECTS[(styleHash >> 2) % ASPECTS.length]!;

  return { widthWeight, heightScale, leanDeg, preferredStyle, aspect };
}

export function assignCoverStyles(
  idsInOrder: string[],
  available: Record<string, readonly CoverStyle[]>,
): Record<string, CoverStyle> {
  const assigned: Record<string, CoverStyle> = {};
  const recent: CoverStyle[] = [];

  for (const id of idsInOrder) {
    const preferred = layoutForArticle(id).preferredStyle;
    const options = available[id] ?? [preferred];
    let chosen = options.includes(preferred) ? preferred : options[0]!;

    if (
      recent.length >= 2 &&
      recent.at(-1) === chosen &&
      recent.at(-2) === chosen
    ) {
      const alternative = options.find((style) => style !== chosen);
      if (alternative) {
        chosen = alternative;
      }
    }

    assigned[id] = chosen;
    recent.push(chosen);
  }

  return assigned;
}

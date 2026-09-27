"use client";

import type { CSSProperties } from "react";
import { Magazine } from "@/components/Magazine";
import {
  resolveCover,
  type CoverManifestEntry,
} from "@/lib/covers";
import {
  assignCoverStyles,
  type CoverStyle,
} from "@/lib/magazines";
import type { Article } from "@/lib/types";

type ShelfRowProps = {
  articles: Article[];
  coverManifest: readonly CoverManifestEntry[];
  coverStyles?: Record<string, CoverStyle>;
  rowIndex: number;
  onSelect: (article: Article) => void;
};

type ShelfStyle = CSSProperties & {
  "--shelf-row": number;
};

export function ShelfRow({
  articles,
  coverManifest,
  coverStyles,
  rowIndex,
  onSelect,
}: ShelfRowProps) {
  const available: Record<string, CoverStyle[]> = {};
  for (const article of articles) {
    const variants = coverManifest
      .filter((entry) => entry.id === article.id && entry.style !== "fallback")
      .map((entry) => entry.style as CoverStyle);
    if (variants.length > 0) available[article.id] = variants;
  }
  const styles =
    coverStyles ??
    assignCoverStyles(
      articles.map((article) => article.id),
      available,
    );
  const style: ShelfStyle = { "--shelf-row": rowIndex };

  return (
    <div className="shelf-row" style={style}>
      <div className="shelf-row__magazines">
        {articles.map((article) => {
          const coverStyle = styles[article.id];
          const prioritizedManifest = [
            ...coverManifest.filter(
              (entry) =>
                entry.id === article.id && entry.style === coverStyle,
            ),
            ...coverManifest,
          ];

          return (
            <Magazine
              key={article.id}
              article={article}
              coverSrc={resolveCover(article, prioritizedManifest)}
              coverStyle={coverStyle}
              onSelect={onSelect}
            />
          );
        })}
      </div>
      <div className="shelf-row__wood" aria-hidden="true">
        <span className="shelf-row__lip" />
      </div>
    </div>
  );
}

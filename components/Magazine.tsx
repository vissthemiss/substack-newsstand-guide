"use client";

import type { CSSProperties } from "react";
import { layoutForArticle, type CoverStyle } from "@/lib/magazines";
import type { Article } from "@/lib/types";

type MagazineProps = {
  article: Article;
  coverSrc: string | null;
  coverStyle?: CoverStyle;
  onSelect: (article: Article) => void;
};

type MagazineStyle = CSSProperties & {
  "--magazine-width": string;
  "--magazine-height": string;
  "--magazine-lean": string;
};

export function Magazine({
  article,
  coverSrc,
  coverStyle,
  onSelect,
}: MagazineProps) {
  const layout = layoutForArticle(article.id);
  const style: MagazineStyle = {
    "--magazine-width": `${layout.widthWeight}px`,
    "--magazine-height": `${layout.heightScale * 100}%`,
    "--magazine-lean": `${layout.leanDeg}deg`,
  };

  return (
    <button
      type="button"
      className="magazine"
      style={style}
      aria-label={article.title}
      onClick={() => onSelect(article)}
    >
      <span className="magazine__lean">
        <span
          className={`magazine__paper magazine__paper--${
            coverStyle ?? layout.preferredStyle
          }`}
        >
          {coverSrc ? (
            <img
              className="magazine__cover"
              src={coverSrc}
              alt=""
              draggable={false}
            />
          ) : (
            <span className="magazine__fallback">{article.title}</span>
          )}
        </span>
      </span>
    </button>
  );
}

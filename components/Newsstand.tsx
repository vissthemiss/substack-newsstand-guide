"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArticlePreviewDialog } from "@/components/ArticlePreviewDialog";
import { ShelfRow } from "@/components/ShelfRow";
import type { CoverManifestEntry } from "@/lib/covers";
import {
  collectTopics,
  filterArticles,
  sortArticles,
} from "@/lib/filters";
import {
  assignCoverStyles,
  type CoverStyle,
} from "@/lib/magazines";
import type { Article } from "@/lib/types";

type NewsstandProps = {
  articles: Article[];
  rankedIds: string[];
  coverManifest: readonly CoverManifestEntry[];
  onSelect?: (article: Article) => void;
};

type Topic = "All" | "General" | string;
type SortMode = "new" | "top";

export function rackCapacity(width: number): number {
  if (width >= 950) return 8;
  if (width >= 650) return 7;
  if (width >= 460) return 4;
  if (width >= 360) return 3;
  return 2;
}

function chunkArticles(articles: Article[], capacity: number): Article[][] {
  const rows: Article[][] = [];
  for (let index = 0; index < articles.length; index += capacity) {
    rows.push(articles.slice(index, index + capacity));
  }
  return rows;
}

export function Newsstand({
  articles,
  rankedIds,
  coverManifest,
  onSelect = () => undefined,
}: NewsstandProps) {
  const rackRef = useRef<HTMLDivElement>(null);
  const dialogTriggerRef = useRef<HTMLButtonElement>(null);
  const [topic, setTopic] = useState<Topic>("All");
  const [sortMode, setSortMode] = useState<SortMode>("new");
  const [capacity, setCapacity] = useState(8);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    const rack = rackRef.current;
    if (!rack) return;

    const updateCapacity = (width: number) => {
      setCapacity(rackCapacity(width));
    };
    updateCapacity(rack.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateCapacity(entry.contentRect.width);
    });
    observer.observe(rack);
    return () => observer.disconnect();
  }, []);

  const topics = useMemo(() => {
    const values = collectTopics(articles);
    return articles.some((article) => article.tags.length === 0)
      ? ["All", ...values, "General"]
      : ["All", ...values];
  }, [articles]);

  const visible = useMemo(
    () =>
      sortArticles(
      filterArticles(articles, topic),
      sortMode,
      rankedIds,
      ),
    [articles, rankedIds, sortMode, topic],
  );
  const coverStyles = useMemo(() => {
    const available: Record<string, CoverStyle[]> = {};
    for (const article of visible) {
      const variants = coverManifest
        .filter(
          (entry) => entry.id === article.id && entry.style !== "fallback",
        )
        .map((entry) => entry.style as CoverStyle);
      if (variants.length > 0) available[article.id] = variants;
    }
    return assignCoverStyles(
      visible.map((article) => article.id),
      available,
    );
  }, [coverManifest, visible]);
  const rows = useMemo(
    () => chunkArticles(visible, capacity),
    [capacity, visible],
  );
  const handleSelect = (article: Article) => {
    if (document.activeElement instanceof HTMLButtonElement) {
      dialogTriggerRef.current = document.activeElement;
    }
    setSelectedArticle(article);
    onSelect(article);
  };

  return (
    <section className="newsstand" aria-labelledby="newsstand-heading">
      <div className="newsstand__heading-row">
        <div>
          <p className="newsstand__eyebrow">The archive</p>
          <h2 id="newsstand-heading">Choose an issue</h2>
        </div>
        <div className="newsstand__sort" aria-label="Sort articles">
          <button
            type="button"
            aria-pressed={sortMode === "new"}
            onClick={() => setSortMode("new")}
          >
            Newest
          </button>
          <button
            type="button"
            aria-pressed={sortMode === "top"}
            onClick={() => setSortMode("top")}
          >
            Top reads
          </button>
        </div>
      </div>

      <div className="newsstand__topics" aria-label="Filter by topic">
        {topics.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={topic === value}
            onClick={() => setTopic(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="newsstand__rack" ref={rackRef}>
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <ShelfRow
              key={row.map((article) => article.id).join(":")}
              articles={row}
              coverManifest={coverManifest}
              coverStyles={coverStyles}
              rowIndex={index}
              onSelect={handleSelect}
            />
          ))
        ) : (
          <p className="newsstand__empty">No stories on this shelf yet.</p>
        )}
      </div>

      <ArticlePreviewDialog
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        triggerRef={dialogTriggerRef}
      />
    </section>
  );
}

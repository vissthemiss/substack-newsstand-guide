"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import type { Article } from "@/lib/types";

type ArticlePreviewDialogProps = {
  article: Article | null;
  coverSrc: string | null;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function ArticlePreviewDialog({
  article,
  coverSrc,
  onClose,
  triggerRef,
}: ArticlePreviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!article || !dialog) return;

    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      triggerRef.current?.focus();
    };
  }, [article, triggerRef]);

  if (!article) return null;

  const formattedDate = dateFormatter.format(new Date(article.date));

  return (
    <dialog
      ref={dialogRef}
      className="article-preview"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onClose={onClose}
    >
      <article
        className={`article-preview__content${
          coverSrc ? "" : " article-preview__content--text-only"
        }`}
      >
        <button
          ref={closeRef}
          className="article-preview__close"
          type="button"
          aria-label="Close article preview"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>

        {coverSrc ? (
          <img className="article-preview__cover" src={coverSrc} alt="" />
        ) : null}

        <div className="article-preview__body">
          <div className="article-preview__meta">
            <time dateTime={article.date}>{formattedDate}</time>
            {article.isPaid ? (
              <span className="article-preview__paid">Paid</span>
            ) : null}
          </div>

          <h2 id={titleId}>{article.title}</h2>

          {article.subtitle ? (
            <p className="article-preview__subtitle">{article.subtitle}</p>
          ) : null}

          {article.tags.length > 0 ? (
            <ul className="article-preview__topics" aria-label="Topics">
              {article.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}

          <a
            className="article-preview__link"
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read on Substack
          </a>
        </div>
      </article>
    </dialog>
  );
}

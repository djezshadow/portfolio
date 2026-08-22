"use client";

import { useState } from "react";
import { InstagramEmbedItem, InstagramEmbedScript } from "./instagram-embed";

export type InstagramPostItem = { id: string; url: string; caption: string | null };
export type InstagramHighlightItem = { id: string; url: string; caption: string | null; coverImageUrl: string | null };

// El degradé exacto que usa Instagram en el aro de las Historias/Destacadas.
const RING_GRADIENT = "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)";

function HighlightCircle({ item }: { item: InstagramHighlightItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="magnetic"
      className="flex w-20 shrink-0 flex-col items-center gap-2 text-center"
    >
      <span className="rounded-full p-[3px]" style={{ background: RING_GRADIENT }}>
        {item.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverImageUrl}
            alt=""
            className="h-16 w-16 rounded-full border-[3px] border-[var(--bg)] object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[var(--bg)] bg-[var(--glass-border)] text-lg">
            📷
          </span>
        )}
      </span>
      {item.caption && <span className="line-clamp-2 font-mono text-[10px] leading-tight">{item.caption}</span>}
    </a>
  );
}

export function InstagramFeed({
  title,
  handle,
  feed,
  highlights,
  labels,
}: {
  title: string;
  handle: string | null;
  feed: InstagramPostItem[];
  highlights: InstagramHighlightItem[];
  labels: { feed: string; highlights: string; followOn: string };
}) {
  if (feed.length === 0 && highlights.length === 0) return null;

  return (
    <section className="pb-24">
      <InstagramEmbedScript />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">{title}</h2>
        {handle && (
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="magnetic"
            className="glass rounded-full px-4 py-1.5 font-mono text-[11px]"
          >
            {labels.followOn} @{handle}
          </a>
        )}
      </div>

      {highlights.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
            {labels.highlights}
          </p>
          <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {highlights.map((h) => (
              <HighlightCircle key={h.id} item={h} />
            ))}
          </div>
        </div>
      )}

      {feed.length > 0 && (
        <div>
          {highlights.length > 0 && (
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
              {labels.feed}
            </p>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {feed.map((post) => (
              <InstagramEmbedItem key={post.id} url={post.url} caption={post.caption} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

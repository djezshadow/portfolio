"use client";

import { useState } from "react";
import { InstagramEmbedItem, InstagramEmbedScript } from "./instagram-embed";

export type InstagramPostItem = { id: string; url: string; caption: string | null };

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
  highlights: InstagramPostItem[];
  labels: { feed: string; highlights: string; followOn: string };
}) {
  const hasBoth = feed.length > 0 && highlights.length > 0;
  const [tab, setTab] = useState<"feed" | "highlight">(highlights.length > 0 ? "highlight" : "feed");
  const items = tab === "highlight" ? highlights : feed;

  if (feed.length === 0 && highlights.length === 0) return null;

  return (
    <section className="pb-24">
      <InstagramEmbedScript />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">{title}</h2>
        <div className="flex items-center gap-3">
          {hasBoth && (
            <div className="glass flex gap-1 rounded-full p-1 font-mono text-[11px]">
              <button
                onClick={() => setTab("highlight")}
                data-cursor="magnetic"
                className={`rounded-full px-3 py-1 transition-colors ${tab === "highlight" ? "bg-[var(--accent)] text-[var(--bg)]" : ""}`}
              >
                {labels.highlights}
              </button>
              <button
                onClick={() => setTab("feed")}
                data-cursor="magnetic"
                className={`rounded-full px-3 py-1 transition-colors ${tab === "feed" ? "bg-[var(--accent)] text-[var(--bg)]" : ""}`}
              >
                {labels.feed}
              </button>
            </div>
          )}
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
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((post) => (
          <InstagramEmbedItem key={post.id} url={post.url} caption={post.caption} />
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { PortfolioDialog } from "./portfolio-dialog";
import type { ParsedVideo } from "@/lib/video-url";

export function ReelTrigger({ video, en }: { video: ParsedVideo; en: boolean }) {
  const [open, setOpen] = useState(false);
  const label = en ? "Play showreel" : "Ver reel";
  const youtube = video.provider === "youtube";
  const id = encodeURIComponent(video.videoId);
  const src = youtube
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${id}?autoplay=1`;
  const watchUrl = youtube ? `https://www.youtube.com/watch?v=${id}` : `https://vimeo.com/${id}`;
  return <>
    <button type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 font-medium text-black focus-visible:outline-2 focus-visible:outline-offset-4">
      <span aria-hidden="true">▶</span>{label}
    </button>
    {open && <PortfolioDialog title={label} closeLabel={en ? "Close" : "Cerrar"} onClose={() => setOpen(false)} wide>
      <iframe src={src} title={label} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
        className="aspect-video w-full rounded-xl bg-black" />
      <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-accent underline">
        {en ? "Open on" : "Abrir en"} {youtube ? "YouTube" : "Vimeo"}
      </a>
    </PortfolioDialog>}
  </>;
}

"use client";

import { useState } from "react";
import { PortfolioDialog } from "./portfolio-dialog";

export function ReelTrigger({ src, en }: { src: string; en: boolean }) {
  const [open, setOpen] = useState(false);
  const label = en ? "Play showreel" : "Ver reel";
  return <>
    <button type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 font-medium text-black focus-visible:outline-2 focus-visible:outline-offset-4">
      <span aria-hidden="true">▶</span>{label}
    </button>
    {open && <PortfolioDialog title={label} closeLabel={en ? "Close" : "Cerrar"} onClose={() => setOpen(false)} wide>
      <iframe src={src} title={label} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
        className="aspect-video w-full rounded-xl bg-black" />
    </PortfolioDialog>}
  </>;
}

"use client";

import { useState } from "react";
import { PortfolioDialog } from "./portfolio-dialog";

export function CvDownloadLink({ href, label, className, locale = "es", fileLabel }: {
  href: string;
  label: string;
  className?: string;
  locale?: "es" | "en";
  fileLabel?: { es: string; en: string };
}) {
  const [open, setOpen] = useState(false);
  const en = locale === "en";
  const title = en ? `Download ${fileLabel?.en ?? "the CV"}?` : `¿Descargar ${fileLabel?.es ?? "el CV"}?`;
  return <>
    <button type="button" aria-haspopup="dialog" data-cursor="magnetic" onClick={() => setOpen(true)} className={className}>{label}</button>
    {open && <PortfolioDialog title={title} onClose={() => setOpen(false)} closeLabel={en ? "Cancel" : "Cancelar"}>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        {en ? "You're about to download a PDF file." : "Estás por descargar un archivo PDF."}
      </p>
      <a href={href} onClick={() => setOpen(false)} className="glass inline-flex min-h-11 items-center rounded-full px-5">
        {en ? "Download" : "Descargar"}
      </a>
    </PortfolioDialog>}
  </>;
}

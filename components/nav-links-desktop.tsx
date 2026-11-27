"use client";

import { useState } from "react";
import { PortfolioDialog } from "./portfolio-dialog";
import Link from "next/link";
import { CvDownloadLink } from "./cv-download-link";

type ComingSoonLink = {
  href: string;
  label: string;
  isComingSoon?: boolean;
  hint?: string | null;
  emphasis?: boolean;
  isCv?: boolean;
};

/**
 * Fila de links del nav de desktop, con soporte para categorías
 * "Coming Soon": se ven grises/deshabilitadas y al tocarlas muestran un
 * popup con la pista en vez de navegar (mismo comportamiento que las
 * cards del carrusel de la home).
 */
export function NavLinksDesktop({ links, locale }: { links: ComingSoonLink[]; locale: "es" | "en" }) {
  const [hintOpen, setHintOpen] = useState<{ label: string; hint: string | null } | null>(null);

  return (
    <>
      {links.map((link) =>
        link.isComingSoon ? (
          <button
            key={link.href}
            type="button"
            onClick={() => setHintOpen({ label: link.label, hint: link.hint ?? null })}
            data-cursor="magnetic"
            className="shrink-0 rounded-full px-3 py-2 text-[var(--ink-muted)] opacity-50 grayscale"
          >
            {link.label} 🔒
          </button>
        ) : link.isCv ? (
          <CvDownloadLink
            key={link.href}
            href={link.href}
            locale={locale}
            label={link.label}
            className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-2 text-[var(--bg)] transition-opacity hover:opacity-85"
          />
        ) : (
          <Link
            key={link.href}
            href={link.href}
            data-cursor="magnetic"
            className={
              link.emphasis
                ? "shrink-0 rounded-full bg-[var(--accent)] px-3 py-2 text-[var(--bg)] transition-opacity hover:opacity-85"
                : "shrink-0 rounded-full px-3 py-2 text-[var(--ink-muted)] transition-colors hover:text-accent"
            }
          >
            {link.label}
          </Link>
        )
      )}

      {hintOpen && <PortfolioDialog title={hintOpen.label} onClose={() => setHintOpen(null)}
        closeLabel={locale === "en" ? "Close" : "Cerrar"}>
        <p className="text-sm text-accent">{locale === "en" ? "Coming soon" : "Próximamente"}</p>
        {hintOpen.hint && <p className="mt-2 text-sm">{hintOpen.hint}</p>}
      </PortfolioDialog>}
    </>
  );
}

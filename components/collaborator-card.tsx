"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PortfolioDialog } from "./portfolio-dialog";

type Participant = {
  id: string;
  name: string | null;
  role: string | null;
  roleEn: string | null;
  instagram: string | null;
  website: string | null;
};

type Collaborator = {
  id: string;
  name: string;
  logoUrl: string | null;
  instagram: string | null;
  website: string | null;
  participants?: Participant[];
};

export function CollaboratorCard({
  collaborator,
  size = "md",
  locale = "es",
}: {
  collaborator: Collaborator;
  size?: "sm" | "md";
  locale?: "es" | "en";
}) {
  const [open, setOpen] = useState(false);
  const participants = collaborator.participants ?? [];
  const dim = size === "sm" ? "h-14 w-14" : "h-24 w-24 sm:h-28 sm:w-28";
  // Ancho fijo del ítem completo (icono + nombre) para que un nombre largo
  // no empuje ni desacomode al resto de la grilla — el texto se acomoda
  // en hasta 2 líneas adentro de ese ancho en vez de estirar la columna.
  const itemWidth = size === "sm" ? "w-16" : "w-24 sm:w-28";

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        data-cursor="magnetic"
        className={`flex ${itemWidth} flex-col items-center gap-2`}
        aria-label={collaborator.name}
      >
        {collaborator.logoUrl ? (
          <div className={`relative ${dim} overflow-hidden rounded-full bg-black/10 transition-transform hover:scale-105`}>
            <Image src={collaborator.logoUrl} alt={collaborator.name} fill className="object-cover" />
          </div>
        ) : (
          <div
            className={`flex ${dim} items-center justify-center rounded-full bg-black/10 font-display text-xl transition-transform hover:scale-105`}
          >
            {collaborator.name.charAt(0)}
          </div>
        )}
        {size === "md" && (
          <span className="line-clamp-2 w-full break-words font-mono text-[11px] leading-tight text-[var(--ink-muted)]">
            {collaborator.name}
          </span>
        )}
      </button>

      {open && <PortfolioDialog title={collaborator.name} onClose={() => setOpen(false)} closeLabel={locale === "en" ? "Close" : "Cerrar"}>
              <div className="w-full space-y-2">
                <Link href={`/${locale}/colaboradores/${collaborator.id}`} onClick={() => setOpen(false)}
                  className="block rounded-full bg-[var(--accent)] px-4 py-3 font-medium text-[var(--bg)]">
                  {locale === "en" ? "See projects together" : "Ver trabajos juntos"}
                </Link>
                {collaborator.website && (
                  <a
                    href={collaborator.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="magnetic"
                    className="block w-full rounded-full bg-[var(--accent)] py-2 font-mono text-xs text-[var(--bg)]"
                  >
                    Website ↗
                  </a>
                )}
                {collaborator.instagram && (
                  <a
                    href={collaborator.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="magnetic"
                    className="glass block w-full rounded-full py-2 font-mono text-xs"
                  >
                    Instagram ↗
                  </a>
                )}
              </div>

              {participants.length > 0 && (
                <div className="w-full space-y-2 border-t border-[var(--glass-border)] pt-4">
                  <p className="font-mono text-[10px] uppercase text-[var(--ink-muted)]">
                    {locale === "en" ? "Team" : "Participantes"}
                  </p>
                  {participants.map((p) => {
                    const role = locale === "en" ? p.roleEn || p.role : p.role;
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-2 text-left">
                        <div>
                          {p.name && <p className="font-mono text-xs">{p.name}</p>}
                          {role && <p className="font-mono text-[10px] text-[var(--ink-muted)]">{role}</p>}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {p.website && (
                            <a
                              href={p.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-cursor="magnetic"
                              className="font-mono text-[10px] text-accent underline"
                            >
                              Web
                            </a>
                          )}
                          {p.instagram && (
                            <a
                              href={p.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-cursor="magnetic"
                              className="font-mono text-[10px] text-accent underline"
                            >
                              IG
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

      </PortfolioDialog>}
    </>
  );
}

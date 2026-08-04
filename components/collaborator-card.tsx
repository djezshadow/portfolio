"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

type Collaborator = {
  id: string;
  name: string;
  logoUrl: string | null;
  instagram: string | null;
  website: string | null;
};

export function CollaboratorCard({
  collaborator,
  size = "md",
}: {
  collaborator: Collaborator;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const hasLinks = Boolean(collaborator.instagram || collaborator.website);
  const dim = size === "sm" ? "h-14 w-14" : "h-24 w-24 sm:h-28 sm:w-28";

  return (
    <>
      <button
        onClick={() => hasLinks && setOpen(true)}
        data-cursor="magnetic"
        className="flex flex-col items-center gap-2"
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
          <span className="font-mono text-[11px] text-[var(--ink-muted)]">{collaborator.name}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="glass glass-distort flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl p-6 text-center"
            >
              {collaborator.logoUrl && (
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-black/10">
                  <Image src={collaborator.logoUrl} alt={collaborator.name} fill className="object-cover" />
                </div>
              )}
              <p className="font-display text-lg">{collaborator.name}</p>

              <div className="w-full space-y-2">
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

              <button
                onClick={() => setOpen(false)}
                data-cursor="magnetic"
                className="font-mono text-[10px] text-[var(--ink-muted)] underline"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

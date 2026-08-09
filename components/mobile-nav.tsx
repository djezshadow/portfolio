"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";

type NavLink = { href: string; label: string };

/**
 * Menú de celular (item de rediseño de navbar): 3 rayitas arriba a la
 * derecha que abren un panel lateral. Se cierra tocando afuera, tocando
 * la cruz, o arrastrando el panel hacia la derecha (deslizable con el
 * dedo, como pediste).
 */
export function MobileNav({
  links,
  otherLocaleHref,
  otherLocaleLabel,
}: {
  links: NavLink[];
  otherLocaleHref: string;
  otherLocaleLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-cursor="magnetic"
        aria-label="Abrir menú"
        className="nav-surface flex h-11 w-11 items-center justify-center rounded-full sm:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[190] bg-black/50 sm:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.5 }}
              onDragEnd={(_, info) => {
                // Deslizás el panel hacia la derecha (de donde vino) para
                // cerrarlo, como un sidebar nativo.
                if (info.offset.x > 80 || info.velocity.x > 500) setOpen(false);
              }}
              className="nav-surface fixed inset-y-0 right-0 z-[200] flex w-[78%] max-w-xs flex-col gap-1 rounded-l-2xl p-6 pt-8 font-mono text-sm sm:hidden"
            >
              <button
                onClick={() => setOpen(false)}
                data-cursor="magnetic"
                aria-label="Cerrar menú"
                className="mb-4 flex h-9 w-9 items-center justify-center self-end rounded-full bg-black/10 text-lg"
              >
                ×
              </button>

              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-cursor="magnetic"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-[var(--ink-muted)] transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-4 flex items-center justify-between border-t border-[var(--glass-border)] pt-4">
                <Link
                  href={otherLocaleHref}
                  data-cursor="magnetic"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-[var(--ink-muted)] transition-colors hover:text-accent"
                >
                  {otherLocaleLabel}
                </Link>
                <ThemeToggle />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

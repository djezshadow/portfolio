"use client";

import { useEffect, useRef } from "react";

export function PortfolioDialog({ title, children, onClose, closeLabel = "Cerrar", wide = false }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  closeLabel?: string;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} aria-label={title} onCancel={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className={`m-auto max-h-[90dvh] overflow-auto rounded-2xl bg-transparent p-0 text-[var(--ink)] backdrop:bg-black/65 ${wide ? "w-[min(94vw,64rem)]" : "max-w-[min(90vw,24rem)]"}`}>
      <div className="nav-surface rounded-2xl p-6 text-center">
        <h2 className="mb-3 font-display text-xl">{title}</h2>
        {children}
        <button type="button" autoFocus onClick={onClose}
          className="mt-4 rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--bg)]">
          {closeLabel}
        </button>
      </div>
    </dialog>
  );
}

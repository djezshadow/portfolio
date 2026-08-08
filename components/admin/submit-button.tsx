"use client";

import { useFormStatus } from "react-dom";
import clsx from "clsx";

/**
 * Botón de submit con feedback de carga (item #12: "necesito un indicio
 * claro de que algo está cargando cuando se presiona un botón"). Usa
 * useFormStatus, así que tiene que ir DENTRO de un <form> con una
 * server action — se entera solo de cuándo esa acción está en curso,
 * sin manejar estado a mano en cada formulario.
 */
export function SubmitButton({
  children,
  pendingText = "Guardando…",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      data-cursor="magnetic"
      className={clsx(
        "flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-3 font-mono text-sm text-[var(--bg)] transition-opacity",
        pending && "opacity-70",
        className
      )}
    >
      {pending && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--bg)]/40 border-t-[var(--bg)]" />
      )}
      {pending ? pendingText : children}
    </button>
  );
}

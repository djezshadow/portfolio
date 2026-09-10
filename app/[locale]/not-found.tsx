import Link from "next/link";
import { defaultLocale } from "@/lib/i18n/dictionaries";

/**
 * Pedido: "hacer una página error 404, para cuando no carga". Vive
 * dentro de app/[locale]/ porque el middleware siempre agrega el
 * prefijo de idioma (/es o /en) antes de que una ruta pueda no existir
 * — así que un 404 real siempre cae acá adentro, heredando el navbar y
 * el footer normales del sitio.
 *
 * Next.js no le pasa los params de la ruta a este archivo especial, así
 * que en vez de adivinar el idioma mostramos los dos juntos — evita
 * mostrar el mensaje en el idioma equivocado.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 font-mono text-xs text-accent">404 — SC-∅∅</span>
      <h1 className="mb-4 font-display text-4xl sm:text-5xl">
        Escena no encontrada
        <br />
        <span className="text-[var(--ink-muted)]">Scene not found</span>
      </h1>
      <p className="mb-2 max-w-md font-body text-[var(--ink-muted)]">
        Esta toma no quedó en el corte final — el link puede estar roto o la página ya no existe.
      </p>
      <p className="mb-8 max-w-md font-body text-[var(--ink-muted)]">
        This shot didn&apos;t make the final cut — the link may be broken or the page no longer
        exists.
      </p>
      <Link
        href={`/${defaultLocale}`}
        data-cursor="magnetic"
        className="glass inline-block rounded-full px-6 py-2.5 font-mono text-sm"
      >
        Volver al inicio / Back home
      </Link>
    </div>
  );
}

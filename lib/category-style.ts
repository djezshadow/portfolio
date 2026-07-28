import type { CategoryStyle } from "@prisma/client";
import type { CSSProperties } from "react";

const FONT_VARS: Record<string, string> = {
  display: "var(--font-display)",
  body: "var(--font-body)",
  mono: "var(--font-mono)",
};

/**
 * Traduce la fila CategoryStyle (item #22 del spec: color, tipografía, bold,
 * tachado, alineación, stroke) a un objeto de estilos React aplicable
 * directamente sobre el título/encabezado de la categoría.
 */
export function categoryStyleToCSS(style: CategoryStyle | null | undefined): CSSProperties {
  if (!style) return {};

  return {
    color: style.accentColor ?? undefined,
    fontFamily: style.fontFamily ? FONT_VARS[style.fontFamily] : undefined,
    fontWeight: style.bold ? 700 : undefined,
    textDecoration: style.strikethrough ? "line-through" : undefined,
    textAlign: (style.alignment as CSSProperties["textAlign"]) ?? "left",
    WebkitTextStroke: style.strokeWidth ? `${style.strokeWidth}px var(--ink)` : undefined,
  };
}

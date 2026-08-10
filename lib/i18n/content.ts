import type { Locale } from "./dictionaries";

/**
 * Si `locale` es "en" y hay una traducción cargada, la usa.
 * Si no, cae automáticamente al valor en español — tal como se pidió:
 * "si dejo inglés vacío, se pone automáticamente lo de español".
 */
export function loc(base: string, enValue: string | null | undefined, locale: Locale): string {
  if (locale === "en" && enValue && enValue.trim() !== "") return enValue;
  return base;
}

export function locOrNull(
  base: string | null | undefined,
  enValue: string | null | undefined,
  locale: Locale
): string | null {
  if (locale === "en" && enValue && enValue.trim() !== "") return enValue;
  return base ?? null;
}

export function formatDateRange(
  dateStart: Date | string | null,
  dateEnd: Date | string | null,
  isOngoing: boolean,
  locale: "es" | "en" = "es"
): string | null {
  if (!dateStart) return null;

  const startYear = new Date(dateStart).getFullYear();
  const present = locale === "en" ? "Present" : "Actualidad";

  if (isOngoing) return `${startYear} — ${present}`;
  if (!dateEnd) return `${startYear}`;

  const endYear = new Date(dateEnd).getFullYear();
  if (endYear === startYear) return `${startYear}`;
  return `${startYear} — ${endYear}`;
}

/** Convierte un Date a formato "YYYY-MM" para precargar un <input type="month"> */
export function toMonthInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

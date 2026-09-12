import { prisma } from "./prisma";

const OPTIMIZE = process.env.OPTIMIZE_ISR === "true";

export async function getSiteSettings() {
  if (!OPTIMIZE) {
    return prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
  }

  // OPTIMIZACIÓN (mismo flag OPTIMIZE_ISR): la ruta de arriba hace un
  // upsert — que ejecuta un UPDATE real — en CADA llamada, aunque el
  // registro ya exista el 99.9% de las veces (esta función se llama
  // desde casi todas las páginas del sitio). Acá primero probamos una
  // lectura simple y barata, y solo escribimos si de verdad no existe
  // todavía (la primera vez que corre el sitio, nunca más después).
  const existing = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.siteSettings.create({ data: { id: "default" } });
}

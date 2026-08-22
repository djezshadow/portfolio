import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

/**
 * Data para el modal secreto (item: "modal manteniendo el logo... una
 * ficha estilo specs de cámara"). Junta las cámaras únicas que aparecen
 * en los EXIF cargados a mano en fotos de proyectos publicados, más el
 * mensaje manual opcional que se configura en Configuración.
 */
export async function GET() {
  const now = new Date();
  const [cameraRows, settings] = await Promise.all([
    prisma.media.findMany({
      where: { exifCamera: { not: null }, project: { publishedAt: { not: null, lte: now } } },
      select: { exifCamera: true },
      distinct: ["exifCamera"],
    }),
    getSiteSettings(),
  ]);

  const cameras = cameraRows
    .map((r: { exifCamera: string | null }) => r.exifCamera)
    .filter((c: string | null): c is string => Boolean(c));

  return NextResponse.json(
    {
      cameras: cameras as string[],
      message: settings.secretSpecsMessage,
      messageEn: settings.secretSpecsMessageEn,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

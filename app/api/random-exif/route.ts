import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Pedido: "cápsula flotante aleatoria" con datos de cámara, alimentada
 * por el EXIF que se carga a mano por foto (item #1). Solo cuenta fotos
 * de proyectos PUBLICADOS y con al menos un campo EXIF cargado —
 * devuelve una al azar. Si no hay ninguna, 204 (la cápsula simplemente
 * no aparece, no rompe nada).
 */
export async function GET() {
  const now = new Date();
  const candidates = await prisma.media.findMany({
    where: {
      type: "image",
      OR: [
        { exifCamera: { not: null } },
        { exifAperture: { not: null } },
        { exifShutterSpeed: { not: null } },
        { exifIso: { not: null } },
        { exifFps: { not: null } },
      ],
      project: { publishedAt: { not: null, lte: now } },
    },
    select: {
      exifCamera: true,
      exifAperture: true,
      exifShutterSpeed: true,
      exifIso: true,
      exifFps: true,
    },
  });

  if (candidates.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return NextResponse.json(pick, { headers: { "Cache-Control": "no-store" } });
}

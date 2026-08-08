import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { applyWatermark } from "@/lib/watermark";
import { getSiteSettings } from "@/lib/site-settings";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

// La config del watermark casi no cambia, pero sin esto se pegaba a la
// base de datos UNA VEZ POR CADA FOTO servida (podían ser 20-30 pedidos
// en paralelo al entrar a un proyecto). La cacheamos 60s: si el admin
// cambia algo en /admin/configuracion, tarda como mucho un minuto en
// notarse en las fotos públicas — a cambio, navegar el sitio es mucho
// más rápido porque no hace esa consulta por cada imagen.
const getCachedSiteSettings = unstable_cache(
  async () => getSiteSettings(),
  ["media-route-site-settings"],
  { revalidate: 60 }
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wantsOriginal = req.nextUrl.searchParams.get("original") === "1";
  // ?w=160 → miniatura chica y liviana (achicamos ANTES de aplicar el
  // watermark, así el procesamiento también es mucho más rápido, no solo
  // el archivo final más chico).
  const widthParam = Number(req.nextUrl.searchParams.get("w") ?? 0);
  const targetWidth = widthParam > 0 && widthParam <= 2000 ? Math.round(widthParam) : null;

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media || media.type !== "image" || !media.url) {
    return new Response("Not found", { status: 404 });
  }

  const sourceRes = await fetch(media.url);
  if (!sourceRes.ok) return new Response("Not found", { status: 404 });
  let sourceBuffer: Buffer = Buffer.from(await sourceRes.arrayBuffer());

  // La imagen original SIN watermark solo se sirve si sos admin logueado y
  // la pedís explícitamente (?original=1) — nunca se linkea desde el sitio
  // público. Cualquier otro pedido siempre lleva el watermark aplicado
  // (si corresponde), para que nunca se pueda "descargar la limpia" desde afuera.
  if (wantsOriginal) {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE_NAME)?.value;
    const isAdmin = token ? await verifySessionToken(token) : false;
    if (!isAdmin) return new Response("No autorizado", { status: 401 });

    return new Response(new Uint8Array(sourceBuffer), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store" },
    });
  }

  // Achicamos primero (si se pidió un ancho) — mucho más rápido de procesar
  // y de aplicarle el watermark que trabajar siempre a resolución completa.
  if (targetWidth) {
    sourceBuffer = await sharp(sourceBuffer).resize({ width: targetWidth, withoutEnlargement: true }).toBuffer();
  }

  let outputBuffer: Buffer = sourceBuffer;

  if (media.watermarkEnabled) {
    try {
      const settings = await getCachedSiteSettings();
      outputBuffer = await applyWatermark(sourceBuffer, {
        opacity: settings.watermarkOpacity,
        position: settings.watermarkPosition as
          | "bottom-right"
          | "bottom-left"
          | "top-right"
          | "top-left"
          | "center",
        customLogoUrl: settings.watermarkUrl,
        scale: settings.watermarkScale,
      });
    } catch (err) {
      console.error("No se pudo aplicar el watermark, se sirve la imagen sin marca:", err);
    }
  }

  const quality = targetWidth && targetWidth <= 200 ? 65 : 82;
  const webp = await sharp(outputBuffer).webp({ quality }).toBuffer();

  return new Response(new Uint8Array(webp), {
    headers: {
      "Content-Type": "image/webp",
      // Las miniaturas cachean más tiempo (cambian poco visualmente aunque
      // se ajuste el watermark); el tamaño completo sigue con cache corto.
      "Cache-Control": targetWidth
        ? "public, max-age=3600, stale-while-revalidate=86400"
        : "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { applyWatermark } from "@/lib/watermark";
import { getSiteSettings } from "@/lib/site-settings";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wantsOriginal = req.nextUrl.searchParams.get("original") === "1";

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media || media.type !== "image" || !media.url) {
    return new Response("Not found", { status: 404 });
  }

  const sourceRes = await fetch(media.url);
  if (!sourceRes.ok) return new Response("Not found", { status: 404 });
  const sourceBuffer = Buffer.from(await sourceRes.arrayBuffer());

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

  let outputBuffer: Buffer = sourceBuffer;

  if (media.watermarkEnabled) {
    try {
      const settings = await getSiteSettings();
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

  const webp = await sharp(outputBuffer).webp({ quality: 82 }).toBuffer();

  return new Response(new Uint8Array(webp), {
    headers: {
      "Content-Type": "image/webp",
      // Cache corto: si cambiás la config del watermark, se refleja en
      // minutos sin tener que re-subir nada.
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

import sharp from "sharp";
import { canViewAlbum, isAdmin } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { applyWatermark, type WatermarkPosition } from "@/lib/watermark";

function coordinates(x: number | null, y: number | null) {
  return x !== null && y !== null && Number.isFinite(x) && Number.isFinite(y)
    && x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : undefined;
}

function previewCoordinates(query: URLSearchParams) {
  const x = query.get("x");
  const y = query.get("y");
  return x === null || y === null ? undefined : coordinates(Number(x), Number(y));
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
  const photo = await prisma.privatePhoto.findUnique({
    where: { id }, select: { albumId: true, album: { select: { accessVersion: true } } },
  });
  if (!photo || !(await canViewAlbum(photo.albumId, photo.album.accessVersion))) {
    return new Response(null, { status: 404, headers });
  }
  const query = new URL(request.url).searchParams;
  const preview = query.has("preview");
  if (preview && !(await isAdmin())) return new Response(null, { status: 404, headers });

  const image = await prisma.privatePhoto.findFirst({
    where: { id, album: { accessVersion: photo.album.accessVersion } },
    select: { bytes: true, watermarkX: true, watermarkY: true },
  });
  if (!image) return new Response(null, { status: 404, headers });

  try {
    const source = Buffer.from(image.bytes);
    const low = query.has("placeholder") && !preview;
    if (low) {
      const tiny = await sharp(source).resize({ width: 64, height: 64, fit: "inside", withoutEnlargement: true })
        .blur(1.5).webp({ quality: 18 }).toBuffer();
      return new Response(new Uint8Array(tiny), { headers: { ...headers, "Content-Type": "image/webp" } });
    }

    const settings = await getSiteSettings();
    const thumbnail = query.has("thumb");
    const options = {
      opacity: Math.max(settings.watermarkOpacity, 25),
      scale: Math.max(settings.watermarkScale, 6),
      position: settings.watermarkPosition as WatermarkPosition,
      coordinates: preview
        ? previewCoordinates(query)
        : coordinates(image.watermarkX, image.watermarkY),
      webpQuality: preview ? 78 : thumbnail ? 75 : 88,
    };
    const size = preview ? 900 : 480;
    const input = preview || thumbnail
      ? await sharp(source).resize({ width: size, height: size, fit: "inside", withoutEnlargement: true }).png().toBuffer()
      : source;
    let marked: Buffer;
    try {
      marked = await applyWatermark(input, { ...options, customLogoUrl: settings.watermarkUrl });
    } catch (error) {
      if (!settings.watermarkUrl) throw error;
      marked = await applyWatermark(input, options);
    }
    return new Response(new Uint8Array(marked), { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch (error) {
    console.error("Error renderizando foto privada", id, error);
    return new Response(null, { status: 503, headers });
  }
}

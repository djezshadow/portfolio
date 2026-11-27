import sharp from "sharp";
import { canViewAlbum, isAdmin } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { applyWatermark, type WatermarkPosition } from "@/lib/watermark";
import { createAlbumImageKeys, deriveAlbumImageKey, exportAlbumPublicKey, importAlbumPublicKey } from "@/lib/album-image-crypto";

function coordinates(x: number | null, y: number | null) {
  return x !== null && y !== null && Number.isFinite(x) && Number.isFinite(y)
    && x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : undefined;
}

function previewCoordinates(query: URLSearchParams) {
  const x = query.get("x");
  const y = query.get("y");
  return x === null || y === null ? undefined : coordinates(Number(x), Number(y));
}

type RouteContext = { params: Promise<{ id: string }> };

export function GET(request: Request, context: RouteContext) {
  return servePhoto(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  const site = request.headers.get("sec-fetch-site");
  const publicKey = request.headers.get("x-album-image-key");
  if (request.headers.get("x-album-view") !== "1" || !publicKey || (site && site !== "same-origin")) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  let viewerKey: CryptoKey;
  try {
    viewerKey = await importAlbumPublicKey(publicKey);
  } catch {
    return new Response(null, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
  return servePhoto(request, context, viewerKey);
}

async function servePhoto(request: Request, { params }: RouteContext, viewerKey?: CryptoKey) {
  const full = !!viewerKey;
  const { id } = await params;
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
  const photo = await prisma.privatePhoto.findUnique({
    where: { id }, select: { albumId: true, album: { select: { accessVersion: true } } },
  });
  const viewerToken = full ? request.headers.get("x-album-token") ?? "" : undefined;
  if (!photo || !(await canViewAlbum(photo.albumId, photo.album.accessVersion, viewerToken))) {
    return new Response(null, { status: 404, headers });
  }
  const query = new URL(request.url).searchParams;
  const preview = !full && query.has("preview");
  if (preview && !(await isAdmin())) return new Response(null, { status: 404, headers });
  const thumbnail = !full && query.has("thumb") && request.headers.get("sec-fetch-dest") === "image";

  try {
    const low = !full && !preview && !thumbnail;
    const [image, storedSettings] = await Promise.all([
      prisma.privatePhoto.findFirst({
        where: { id, album: { accessVersion: photo.album.accessVersion } },
        select: { bytes: true, watermarkX: true, watermarkY: true },
      }),
      low ? null : prisma.siteSettings.findUnique({
        where: { id: "default" },
        select: { watermarkOpacity: true, watermarkScale: true, watermarkPosition: true, watermarkUrl: true },
      }),
    ]);
    if (!image) return new Response(null, { status: 404, headers });
    const source = Buffer.from(image.bytes.buffer, image.bytes.byteOffset, image.bytes.byteLength);
    if (low) {
      const tiny = await sharp(source).resize({ width: 64, height: 64, fit: "inside", withoutEnlargement: true })
        .blur(1.5).webp({ quality: 18 }).toBuffer();
      return new Response(new Uint8Array(tiny), { headers: { ...headers, "Content-Type": "image/webp" } });
    }

    const settings = storedSettings ?? await getSiteSettings();
    const options = {
      opacity: Math.max(settings.watermarkOpacity, 25),
      scale: Math.max(settings.watermarkScale, 6),
      position: settings.watermarkPosition as WatermarkPosition,
      coordinates: preview
        ? previewCoordinates(query)
        : coordinates(image.watermarkX, image.watermarkY),
      webpQuality: preview ? 78 : thumbnail ? 75 : 88,
      webpEffort: 3,
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
    if (!viewerKey) {
      return new Response(new Uint8Array(marked), { headers: { ...headers, "Content-Type": "image/webp" } });
    }
    const keys = await createAlbumImageKeys();
    const key = await deriveAlbumImageKey(viewerKey, keys.privateKey, "encrypt");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new Uint8Array(marked));
    const payload = new Uint8Array(iv.length + ciphertext.byteLength);
    payload.set(iv);
    payload.set(new Uint8Array(ciphertext), iv.length);
    return new Response(payload, { headers: {
      ...headers,
      "Content-Type": "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "X-Album-Image-Key": await exportAlbumPublicKey(keys.publicKey),
    } });
  } catch (error) {
    console.error("Error renderizando foto privada", id, error);
    return new Response(null, { status: 503, headers });
  }
}

import sharp from "sharp";
import { canViewAlbum } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
  const photo = await prisma.privatePhoto.findUnique({
    where: { id }, select: { albumId: true, album: { select: { accessVersion: true } } },
  });
  if (!photo || !(await canViewAlbum(photo.albumId, photo.album.accessVersion))) {
    return new Response(null, { status: 404, headers });
  }
  const image = await prisma.privatePhoto.findFirst({
    where: { id, album: { accessVersion: photo.album.accessVersion } }, select: { bytes: true },
  });
  if (!image) return new Response(null, { status: 404, headers });
  const bytes = new URL(request.url).searchParams.has("thumb")
    ? await sharp(Buffer.from(image.bytes)).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer()
    : image.bytes;
  return new Response(new Uint8Array(bytes), { headers: { ...headers, "Content-Type": "image/webp" } });
}

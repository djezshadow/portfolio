import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { publicProjectWhere } from "@/lib/public-projects";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await prisma.media.findFirst({
    where: { id, type: "image", project: publicProjectWhere() },
    select: { url: true },
  });
  if (!image?.url) return new Response(null, { status: 404 });
  try {
    const file = await fetch(image.url, { signal: AbortSignal.timeout(8000) });
    if (!file.ok) return new Response(null, { status: 404 });
    const size = new URL(request.url).searchParams.get("size") === "feature" ? 960 : 560;
    const output = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate().resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 76, effort: 3 }).toBuffer();
    return new Response(new Uint8Array(output), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("No se pudo preparar la portada", id, error);
    return new Response(null, { status: 503 });
  }
}

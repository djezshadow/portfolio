/**
 * Watermark de marca. Dos modos:
 * - Por defecto: ícono de diafragma/iris de cámara (6 aspas), generado en
 *   código (no depende de fuentes del sistema en el server).
 * - Personalizado: un logo PNG/WebP con transparencia que el admin sube en
 *   /admin/configuracion. Si existe, reemplaza al ícono en todas las fotos.
 */
import type { Gravity } from "sharp";

function apertureSVG(size: number, opacity: number) {
  const blades = 6;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2;
  const innerR = size * 0.22;

  const paths: string[] = [];
  for (let i = 0; i < blades; i++) {
    const a0 = (i / blades) * Math.PI * 2;
    const a1 = ((i + 1) / blades) * Math.PI * 2;
    const x0 = cx + outerR * Math.cos(a0);
    const y0 = cy + outerR * Math.sin(a0);
    const x1 = cx + outerR * Math.cos(a1);
    const y1 = cy + outerR * Math.sin(a1);
    const xi = cx + innerR * Math.cos((a0 + a1) / 2);
    const yi = cy + innerR * Math.sin((a0 + a1) / 2);
    paths.push(`<path d="M ${cx} ${cy} L ${x0} ${y0} A ${outerR} ${outerR} 0 0 1 ${x1} ${y1} Z" fill="#ffffff" fill-opacity="${opacity}" />`);
    paths.push(`<circle cx="${xi}" cy="${yi}" r="${innerR * 0.15}" fill="#000000" fill-opacity="${opacity * 0.3}" />`);
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${outerR - 1}" fill="none" stroke="#ffffff" stroke-opacity="${opacity}" stroke-width="1.5"/>
    ${paths.join("\n")}
  </svg>`;
}

export type WatermarkPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";

const gravityMap: Record<WatermarkPosition, string> = {
  "bottom-right": "southeast",
  "bottom-left": "southwest",
  "top-right": "northeast",
  "top-left": "northwest",
  center: "center",
};

// Cache en memoria del logo personalizado ya procesado (redimensionado +
// con la opacidad aplicada), por tamaño. Como el server function de
// Vercel se reutiliza "tibio" entre pedidos seguidos, esto evita volver a
// bajar y reprocesar el mismo logo en cada foto que se pide — antes era
// un fetch + 2 pasadas de sharp EXTRA por cada imagen servida.
const logoCache = new Map<string, Buffer>();
const LOGO_CACHE_LIMIT = 30;

export async function applyWatermark(
  imageBuffer: Buffer,
  opts: {
    opacity: number;
    position: WatermarkPosition;
    /** URL del logo personalizado (Blob). Si no se pasa, usa el ícono default. */
    customLogoUrl?: string | null;
    /** % del ancho de la foto que ocupa el watermark (default 9, viene de SiteSettings). */
    scale?: number;
  }
): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1200;

  const scalePct = opts.scale ?? 9;
  const size = Math.round(width * (scalePct / 100));
  const opacity = Math.min(Math.max(opts.opacity, 0), 100) / 100;

  let watermarkInput: Buffer;

  if (opts.customLogoUrl) {
    const cacheKey = `${opts.customLogoUrl}:${size}:${opacity}`;
    const cached = logoCache.get(cacheKey);
    if (cached) {
      watermarkInput = cached;
    } else {
      // Logo personalizado: lo bajamos, lo redimensionamos al tamaño calculado
      // (manteniendo proporción) y le aplicamos la opacidad pedida.
      const res = await fetch(opts.customLogoUrl);
      const logoBuffer = Buffer.from(await res.arrayBuffer());
      watermarkInput = await sharp(logoBuffer)
        .resize({ width: size, height: size, fit: "inside" })
        .ensureAlpha()
        .composite([
          {
            // multiplica el canal alpha existente por la opacidad elegida,
            // sin afectar el color del logo
            input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: "dest-in",
          },
        ])
        .png()
        .toBuffer();

      if (logoCache.size >= LOGO_CACHE_LIMIT) logoCache.clear();
      logoCache.set(cacheKey, watermarkInput);
    }
  } else {
    watermarkInput = Buffer.from(apertureSVG(size, opacity));
  }

  return image
    .composite([
      {
        input: watermarkInput,
        gravity: gravityMap[opts.position] as Gravity,
      },
    ])
    .toBuffer();
}

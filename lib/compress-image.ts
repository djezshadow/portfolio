/**
 * Comprime una imagen en el NAVEGADOR antes de subirla (causa real del
 * "Algo falló — unexpected response was received from the server" al
 * subir portadas/fotos): Vercel pone un límite duro de ~4.5MB por
 * request a las funciones serverless, y eso NO se puede subir más alto
 * desde `next.config.mjs` (el `bodySizeLimit: "25mb"` que ya está ahí
 * solo afecta el límite de Next, no el de la infraestructura de Vercel
 * por debajo). Una foto de cámara de celular moderna pesa 3–15MB
 * fácilmente, así que la request se cae ANTES de llegar a nuestro
 * código — por eso el usuario nunca ve un mensaje de error específico,
 * solo "unexpected response".
 *
 * La solución robusta de fondo (subida directa a Blob desde el
 * navegador, sin pasar por una Server Action) es un cambio más grande;
 * esto es la solución rápida y efectiva: redimensionar/comprimir ANTES
 * de armar el FormData, así el archivo que viaja casi nunca supera
 * unos pocos cientos de KB.
 */
export async function compressImageForUpload(
  file: File,
  opts: { maxWidth?: number; maxHeight?: number; quality?: number; requireWebp?: boolean } = {}
): Promise<File> {
  // Si no es una imagen (o el navegador no soporta canvas por algún
  // motivo raro), devolvemos el archivo tal cual — mejor eso que romper
  // la subida por completo.
  if (!file.type.startsWith("image/")) return file;

  const { maxWidth = 2000, maxHeight = 2000, quality = 0.82 } = opts;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      throw new Error("Canvas no disponible");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    if (!blob || blob.type !== "image/webp") throw new Error("WebP no disponible");

    // Si por algún motivo la "compresión" salió más pesada que el
    // original (pasa con imágenes ya muy chicas/simples), nos quedamos
    // con el original.
    if (blob.size >= file.size && (!opts.requireWebp || file.type === "image/webp" && scale === 1)) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    if (opts.requireWebp) throw new Error("No se pudo convertir esta foto a WebP. Probá con un JPEG o PNG.");
    // Cualquier falla acá (formato raro, navegador viejo, etc.) — mejor
    // intentar subir el original que bloquear al usuario.
    return file;
  }
}

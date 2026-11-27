export function isManagedBlob(value: string) {
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([^_]+)_/)?.[1];
  if (!storeId) return false;
  try {
    const url = new URL(value);
    return url.origin === `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com`
      && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

export function projectWebp(value: string) {
  if (!isManagedBlob(value) || !/^\/media\/uploads\/.+\.webp$/i.test(new URL(value).pathname)) {
    throw new Error("La URL no corresponde a una foto WebP de este almacenamiento.");
  }
  return value;
}

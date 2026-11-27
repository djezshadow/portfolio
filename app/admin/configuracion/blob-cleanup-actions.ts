"use server";

import { del, list, type ListBlobResultBlob } from "@vercel/blob";
import { Prisma } from "@prisma/client";
import { isManagedBlob } from "@/lib/managed-blob";
import { isAdmin } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";

type Candidate = { pathname: string; size: number };

const legacyPhoto = /^([^/]+)-([a-z0-9]{24,40})\.(png|jpe?g|heic|heif|tiff?|webp)$/i;
const abandonedUpload = /^media\/uploads\/([0-9a-f-]{36})(?:-[a-z0-9]{24,40})?\.webp$/i;
const oldestAllowed = 7 * 24 * 60 * 60 * 1000;
const contentModels = Prisma.dmmf.datamodel.models.filter(({ name }) =>
  !name.startsWith("Private") && name !== "PhotoOriginalCleanup"
);

async function inventory() {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, abortSignal: AbortSignal.timeout(8000) });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
    if (page.hasMore && !cursor) throw new Error("No se pudo completar el inventario de Blob.");
  } while (cursor);
  return blobs;
}

async function findCandidates(blobs: ListBlobResultBlob[]) {
  const legacy = blobs.flatMap((blob) => {
    const match = legacyPhoto.exec(blob.pathname);
    return match && isManagedBlob(blob.url) ? [{ blob, stem: match[1], suffix: match[2].toLowerCase(), format: match[3].toLowerCase() }] : [];
  });
  const webpSizes = new Map<string, number>();
  for (const { blob, stem, format } of legacy) {
    if (format === "webp") webpSizes.set(stem, Math.min(webpSizes.get(stem) ?? Infinity, blob.size));
  }
  const oldOriginals = legacy.filter(({ blob, stem, format }) =>
    format !== "webp" && Date.now() - blob.uploadedAt.getTime() >= oldestAllowed
    && (webpSizes.get(stem) ?? Infinity) < blob.size
  );
  const abandoned = blobs.flatMap((blob) => {
    const match = abandonedUpload.exec(blob.pathname);
    return match && isManagedBlob(blob.url) && Date.now() - blob.uploadedAt.getTime() >= oldestAllowed
      ? [{ blob, suffix: match[1].toLowerCase() }] : [];
  });
  const candidates = [...oldOriginals, ...abandoned];
  if (!candidates.length) return [];

  // Match the unique Blob suffix in all text fields, including content
  // that embeds an image URL in Markdown or serialized settings.
  const content = Prisma.join(contentModels.map(({ name }) => Prisma.sql`
    SELECT lower(to_jsonb(record)::text) AS body FROM ${Prisma.raw(`"${name}"`)} AS record
  `), " UNION ALL ");
  const keys = Prisma.join([...new Set(candidates.map(({ suffix }) => suffix))]);
  const used = await prisma.$queryRaw<{ suffix: string }[]>`
    WITH content AS MATERIALIZED (${content})
    SELECT suffix FROM unnest(ARRAY[${keys}]::text[]) AS ids(suffix)
    WHERE EXISTS (SELECT 1 FROM content WHERE strpos(body, suffix) > 0)
  `;
  const referenced = new Set(used.map(({ suffix }) => suffix));
  return candidates.filter(({ suffix }) => !referenced.has(suffix)).map(({ blob }) => blob);
}

export async function inspectBlobStorage() {
  if (!(await isAdmin())) throw new Error("No autorizado");
  const blobs = await inventory();
  const candidates: Candidate[] = (await findCandidates(blobs))
    .map(({ pathname, size }) => ({ pathname, size }))
    .sort((a, b) => b.size - a.size);
  return { bytes: blobs.reduce((sum, blob) => sum + blob.size, 0), candidates };
}

export async function removeLegacyOriginals(pathnames: string[]) {
  if (!(await isAdmin())) throw new Error("No autorizado");
  if (!Array.isArray(pathnames) || !pathnames.length || pathnames.length > 100 ||
    pathnames.some((pathname) => typeof pathname !== "string" || pathname.length > 950)) {
    throw new Error("Selección inválida.");
  }
  const candidates = await findCandidates(await inventory());
  const requested = new Set(pathnames);
  const selected = candidates.filter(({ pathname }) => requested.has(pathname));
  if (selected.length !== requested.size) throw new Error("El inventario cambió. Volvé a analizar el almacenamiento.");
  await del(selected.map(({ url }) => url), { abortSignal: AbortSignal.timeout(10000) });
  return { count: selected.length, bytes: selected.reduce((sum, blob) => sum + blob.size, 0) };
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { canViewAlbum } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";
import { unlockAlbum } from "./actions";
import { PrivateGallery } from "@/components/private-gallery";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AlbumPage({ params, searchParams }: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale, id } = await params;
  const { error } = await searchParams;
  const en = locale === "en";
  const album = await prisma.privateAlbum.findUnique({ where: { id }, select: { name: true, accessVersion: true } });
  if (!album) notFound();
  const authorized = await canViewAlbum(id, album.accessVersion);
  const photos = authorized ? await prisma.privatePhoto.findMany({
    where: { albumId: id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true, alt: true },
  }) : [];
  return <main className="mx-auto max-w-5xl space-y-6 px-5 py-12">
    <Link href={`/${locale}/privado`} className="text-accent">{en ? "All private albums" : "Todos los álbumes privados"}</Link>
    <h1 className="font-display text-4xl">{album.name}</h1>
    {authorized ? <PrivateGallery photos={photos} en={en} /> : <form action={unlockAlbum.bind(null, id, locale)} className="glass max-w-md space-y-4 rounded-xl p-5">
      <label className="block">{en ? "Album password" : "Contraseña del álbum"}
        <input name="password" type="password" required maxLength={72} autoComplete="current-password" className="glass mt-2 block w-full rounded-lg px-3 py-2" />
      </label>
      <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[var(--bg)]">{en ? "Open album" : "Abrir álbum"}</button>
      {error && <p role="alert">{error === "2"
        ? (en ? "Too many attempts. Try again in 15 minutes." : "Demasiados intentos. Volvé a probar en 15 minutos.")
        : (en ? "Incorrect password." : "Contraseña incorrecta.")}</p>}
    </form>}
  </main>;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";
import { AlbumAccess } from "./album-access";
import { PrivateGallery } from "@/components/private-gallery";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AlbumPage({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const en = locale === "en";
  const album = await prisma.privateAlbum.findUnique({ where: { id }, select: { name: true } });
  if (!album) notFound();
  const admin = await isAdmin();
  const photos = admin ? await prisma.privatePhoto.findMany({
    where: { albumId: id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true, alt: true },
  }) : [];
  return <main className="mx-auto max-w-5xl space-y-6 px-5 py-12">
    <Link href={`/${locale}/privado`} className="text-accent">{en ? "All private albums" : "Todos los álbumes privados"}</Link>
    <h1 className="font-display text-4xl">{album.name}</h1>
    {admin ? <PrivateGallery photos={photos} en={en} /> : <AlbumAccess key={`${locale}:${id}`} id={id} en={en} />}
  </main>;
}

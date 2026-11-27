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
  return <main className="portfolio-page mx-auto max-w-5xl space-y-6 px-6 py-12">
    <Link href={`/${locale}/privado`} className="block text-center text-accent sm:text-left">{en ? "All private albums" : "Todos los álbumes privados"}</Link>
    <h1 className="text-center font-display text-4xl [overflow-wrap:anywhere] sm:text-left">{album.name}</h1>
    {admin ? <PrivateGallery photos={photos} en={en} /> : <AlbumAccess key={`${locale}:${id}`} id={id} en={en} />}
  </main>;
}

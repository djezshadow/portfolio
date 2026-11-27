import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function PrivateAlbums({ params }: { params: Promise<{ locale: string }> }) {
  await connection();
  const { locale } = await params;
  const albums = await prisma.privateAlbum.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return <main className="mx-auto max-w-5xl px-5 py-12">
    <h1 className="font-display text-4xl">{locale === "en" ? "Private albums" : "Álbumes privados"}</h1>
    <p className="mt-3">{locale === "en" ? "Choose your album and enter the password you were given." : "Elegí tu álbum e ingresá la contraseña que te compartieron."}</p>
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {albums.map((album) => <li key={album.id}>
        <Link href={`/${locale}/privado/${album.id}`} className="glass block rounded-xl p-5 font-display text-xl hover:text-accent">{album.name}</Link>
      </li>)}
    </ul>
    {!albums.length && <p>{locale === "en" ? "No albums available." : "Todavía no hay álbumes disponibles."}</p>}
  </main>;
}

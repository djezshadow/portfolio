import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";
import { AlbumForm } from "./forms";
import { AlbumWatermarkEditor } from "./watermark-editor";
import { getSiteSettings } from "@/lib/site-settings";
import { changeAlbumPassword, createAlbum, deleteAlbum, deleteAlbumPhoto, uploadAlbumPhoto } from "./actions";

const input = "glass rounded-lg px-3 py-2";

export default async function AdminPrivateAlbums() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [albums, settings] = await Promise.all([prisma.privateAlbum.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, photos: {
      select: { id: true, alt: true, watermarkX: true, watermarkY: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    } },
  }), getSiteSettings()]);
  const position = settings.watermarkPosition;
  const defaultPoint = {
    x: position.endsWith("left") ? 0 : position.endsWith("right") ? 1 : 0.5,
    y: position.startsWith("top") ? 0 : position.startsWith("bottom") ? 1 : 0.5,
  };
  return <main className="mx-auto max-w-5xl space-y-8 px-5 py-10">
    <h1 className="font-display text-3xl">Álbumes privados</h1>
    <AlbumForm action={createAlbum} label="Crear álbum">
      <input className={input} name="name" aria-label="Nombre del álbum" placeholder="Nombre del álbum" required maxLength={100} />
      <input className={input} name="password" type="password" aria-label="Contraseña del álbum" placeholder="Contraseña del álbum" required minLength={8} maxLength={72} autoComplete="new-password" />
    </AlbumForm>
    {albums.map((album) => <section key={album.id} className="glass space-y-4 rounded-2xl p-5">
      <h2 className="font-display text-2xl">{album.name}</h2>
      <Link href={`/es/privado/${album.id}`} className="text-accent">Abrir enlace para compartir</Link>
      <AlbumForm action={changeAlbumPassword.bind(null, album.id)} label="Cambiar contraseña">
        <input className={input} name="password" type="password" aria-label="Nueva contraseña" placeholder="Nueva contraseña" required minLength={8} maxLength={72} autoComplete="new-password" />
      </AlbumForm>
      <AlbumForm action={uploadAlbumPhoto.bind(null, album.id)} label="Subir fotos como WebP" photo>
        <input name="photo" type="file" accept="image/*" aria-label="Fotos" required multiple />
        <input className={input} name="alt" aria-label="Descripción para las fotos" placeholder="Descripción opcional" maxLength={160} />
      </AlbumForm>
      <AlbumWatermarkEditor photos={album.photos} defaultPoint={defaultPoint} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {album.photos.map((photo) => <div key={photo.id} className="space-y-2">
          <img src={`/api/album-photo/${photo.id}?thumb=1`} loading="lazy" alt={photo.alt} className="aspect-video w-full rounded-lg object-cover" />
          <AlbumForm action={deleteAlbumPhoto.bind(null, photo.id)} label="Eliminar foto" confirmMessage="¿Eliminar esta foto del álbum?" />
        </div>)}
      </div>
      <AlbumForm action={deleteAlbum.bind(null, album.id)} label="Eliminar álbum" confirmMessage="¿Eliminar este álbum y todas sus fotos?" />
    </section>)}
  </main>;
}

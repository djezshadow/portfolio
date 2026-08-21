import { getSiteSettings } from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";
import { updateInstagramSettings, addInstagramPost, deleteInstagramPost, moveInstagramPost } from "./actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { InstagramPostsPanel } from "@/components/admin/instagram-posts-panel";

export const dynamic = "force-dynamic";

export default async function InstagramAdminPage() {
  let settings = {
    instagramFeedEnabled: false,
    instagramHandle: null as string | null,
    instagramFeedTitle: null as string | null,
    instagramFeedTitleEn: null as string | null,
  };
  let posts: { id: string; url: string; caption: string | null; section: string }[] = [];
  try {
    settings = await getSiteSettings();
    posts = await prisma.instagramPost.findMany({ orderBy: { order: "asc" } });
  } catch (err) {
    console.error("No se pudo leer la config de Instagram (¿corriste prisma db push?):", err);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Instagram</h1>
      <p className="mb-8 text-sm text-[var(--ink-muted)]">
        Mostrá tu feed y tus historias destacadas de Instagram acá en el portfolio. No usa la
        API oficial de Meta (esa requiere una cuenta business vinculada, aprobación de la app y
        renovar tokens) — usa el embed público de Instagram, así que alcanza con pegar el link
        de cada post o reel que quieras mostrar. Tienen que ser posts públicos.
      </p>

      <form action={updateInstagramSettings} className="glass mb-8 space-y-4 rounded-2xl p-5">
        <label className="flex items-center gap-2 font-mono text-sm">
          <input type="checkbox" name="instagramFeedEnabled" defaultChecked={settings.instagramFeedEnabled} />
          Mostrar la sección de Instagram en el sitio público
        </label>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Tu usuario (sin @) — para el botón "Seguime en Instagram"
          </label>
          <input
            name="instagramHandle"
            defaultValue={settings.instagramHandle ?? ""}
            placeholder="djezshadow"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Título de la sección (ES)</label>
            <input
              name="instagramFeedTitle"
              defaultValue={settings.instagramFeedTitle ?? ""}
              placeholder="Instagram"
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Título de la sección (EN)</label>
            <input
              name="instagramFeedTitleEn"
              defaultValue={settings.instagramFeedTitleEn ?? ""}
              placeholder="Instagram"
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <SubmitButton>Guardar</SubmitButton>
      </form>

      <h2 className="mb-1 font-display text-xl">Posts</h2>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        "Destacadas" acá NO son las historias destacadas de tu perfil de Instagram (esas no se
        pueden embeber — Instagram no lo permite desde afuera de la app). Es una curación tuya:
        elegís posts o reels puntuales para que aparezcan primero en esta sección — "Feed" es el
        resto. Si cargás las dos, en el sitio aparece un selector para pasar de una a otra; si
        solo cargás una, se muestra directo. En los dos casos, pegá el link de un post o reel
        específico (no el link a un álbum de destacadas ni al perfil).
      </p>
      <InstagramPostsPanel
        posts={posts}
        addAction={addInstagramPost}
        deleteAction={deleteInstagramPost}
        moveAction={moveInstagramPost}
      />
    </div>
  );
}

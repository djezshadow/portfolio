import { getSiteSettings } from "@/lib/site-settings";
import { updateNotFoundPage } from "./actions";
import { NotFoundForm } from "@/components/admin/not-found-form";

export const dynamic = "force-dynamic";

export default async function Error404AdminPage() {
  let settings = {
    notFoundTitle: null as string | null,
    notFoundTitleEn: null as string | null,
    notFoundMessage: null as string | null,
    notFoundMessageEn: null as string | null,
    notFoundImageUrl: null as string | null,
  };

  try {
    settings = await getSiteSettings();
  } catch (err) {
    console.error("No se pudo leer la config de 404 (¿corriste prisma db push?):", err);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Página 404</h1>
      <p className="mb-8 text-sm text-[var(--ink-muted)]">
        Lo que ve un visitante cuando entra a un link roto o una página que no existe.
      </p>
      <NotFoundForm action={updateNotFoundPage} initial={settings} />
    </div>
  );
}

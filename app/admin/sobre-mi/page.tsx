import { getSiteSettings } from "@/lib/site-settings";
import { updateAboutSettings } from "./actions";
import { AboutForm } from "@/components/admin/about-form";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Sobre mí</h1>
      <p className="mb-8 font-mono text-xs text-[var(--ink-muted)]">
        Sección "Sobre mí / About Me" del sitio público. Podés apagarla del todo, escribir el
        contenido con formato (listas, subtítulos, negrita) y hasta agregar tu propio CSS.
      </p>

      <AboutForm action={updateAboutSettings} initial={settings} />
    </div>
  );
}

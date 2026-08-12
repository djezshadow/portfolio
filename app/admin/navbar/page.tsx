import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { getProfile } from "@/lib/profile";
import { saveNavOrder } from "./actions";
import { NavOrderPanel } from "@/components/admin/nav-order-panel";

export const dynamic = "force-dynamic";

export default async function AdminNavbarPage() {
  const [categories, navProjects, settings, profile] = await Promise.all([
    prisma.category.findMany({ where: { showInNav: true }, orderBy: { order: "asc" }, select: { slug: true, name: true } }),
    prisma.project.findMany({ where: { showInNav: true }, orderBy: { order: "asc" }, select: { id: true, title: true } }),
    getSiteSettings(),
    getProfile(),
  ]);

  const defaultItems = [
    ...categories.map((c) => ({ key: `category:${c.slug}`, label: c.name, hidden: "Categoría" })),
    ...navProjects.map((p) => ({ key: `project:${p.id}`, label: p.title, hidden: "Proyecto" })),
    ...(settings.aboutEnabled ? [{ key: "about", label: "Sobre mí" }] : []),
    { key: "colaboradores", label: "Colaboradores" },
    { key: "contacto", label: "Contacto" },
    ...(profile.cvEnabled ? [{ key: "cv", label: "CV" }] : []),
  ];

  let navOrder: string[] = [];
  try {
    if (settings.navOrder) navOrder = JSON.parse(settings.navOrder);
  } catch {
    // JSON inválido, se ignora
  }

  const ordered =
    navOrder.length > 0
      ? [...defaultItems].sort((a, b) => {
          const ia = navOrder.indexOf(a.key);
          const ib = navOrder.indexOf(b.key);
          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        })
      : defaultItems;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Orden del navbar</h1>
      <p className="mb-8 font-mono text-xs text-[var(--ink-muted)]">
        Acomodá con las flechas el orden en que aparecen los links del navbar público (desktop y
        sidebar de celular). Solo aparecen acá los que ya están visibles — categorías/proyectos con
        "Mostrar en el navbar" activado, y Sobre mí / CV si los tenés habilitados.
      </p>

      <NavOrderPanel initialItems={ordered} saveAction={saveNavOrder} />
    </div>
  );
}

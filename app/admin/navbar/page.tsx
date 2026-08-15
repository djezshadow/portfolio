import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { getProfile } from "@/lib/profile";
import {
  saveNavOrder,
  toggleCategoryNav,
  toggleProjectNav,
  toggleAboutNav,
  toggleCvNav,
  toggleColaboradoresNav,
  toggleContactoNav,
  createCustomNavLink,
  deleteCustomNavLink,
  saveNavLabel,
} from "./actions";
import { NavOrderPanel } from "@/components/admin/nav-order-panel";
import { CustomNavLinksPanel } from "@/components/admin/custom-nav-links-panel";

export const dynamic = "force-dynamic";

export default async function AdminNavbarPage() {
  const [allCategories, navProjects, settings, profile, customLinks] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { slug: true, name: true, showInNav: true } }),
    prisma.project.findMany({ where: { showInNav: true }, orderBy: { order: "asc" }, select: { id: true, title: true } }),
    getSiteSettings(),
    getProfile(),
    prisma.customNavLink.findMany({ orderBy: { order: "asc" } }),
  ]);

  let navLabels: Record<string, { es?: string; en?: string }> = {};
  try {
    if (settings.navLabels) navLabels = JSON.parse(settings.navLabels);
  } catch {
    // JSON inválido, se ignora
  }

  const defaultItems = [
    {
      key: "home",
      label: navLabels.home?.es || "Inicio",
      type: "fixed" as const,
      enabled: true,
      toggleAction: null,
      renameable: true,
      currentEs: navLabels.home?.es ?? "Inicio",
      currentEn: navLabels.home?.en ?? "Home",
    },
    ...allCategories.map((c) => ({
      key: `category:${c.slug}`,
      label: c.name,
      type: "Categoría",
      enabled: c.showInNav,
      toggleAction: toggleCategoryNav.bind(null, c.slug),
    })),
    ...navProjects.map((p) => ({
      key: `project:${p.id}`,
      label: p.title,
      type: "Proyecto",
      enabled: true,
      toggleAction: toggleProjectNav.bind(null, p.id),
    })),
    {
      key: "about",
      label: navLabels.about?.es || "Sobre mí",
      type: "fixed" as const,
      enabled: settings.aboutEnabled,
      toggleAction: toggleAboutNav,
      renameable: true,
      currentEs: navLabels.about?.es ?? "Sobre mí",
      currentEn: navLabels.about?.en ?? "About me",
    },
    {
      key: "colaboradores",
      label: navLabels.colaboradores?.es || "Colaboradores",
      type: "fixed" as const,
      enabled: settings.colaboradoresInNav,
      toggleAction: toggleColaboradoresNav,
      renameable: true,
      currentEs: navLabels.colaboradores?.es ?? "Colaboradores",
      currentEn: navLabels.colaboradores?.en ?? "Collaborators",
    },
    {
      key: "contacto",
      label: navLabels.contacto?.es || "Contacto",
      type: "fixed" as const,
      enabled: settings.contactoInNav,
      toggleAction: toggleContactoNav,
      renameable: true,
      currentEs: navLabels.contacto?.es ?? "Contacto",
      currentEn: navLabels.contacto?.en ?? "Contact",
    },
    {
      key: "cv",
      label: navLabels.cv?.es || "CV",
      type: "fixed" as const,
      enabled: profile.cvEnabled,
      toggleAction: toggleCvNav,
      renameable: true,
      currentEs: navLabels.cv?.es ?? "CV",
      currentEn: navLabels.cv?.en ?? "CV",
    },
    ...customLinks.map((c) => ({
      key: `custom:${c.id}`,
      label: c.label,
      type: "Link custom",
      enabled: true,
      toggleAction: null,
    })),
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
        sidebar de celular), y prendé/apagá cada uno con el ojito — sin tener que ir a buscarlo a
        otra sección. "Home" siempre está prendido, no se puede ocultar. Un ítem apagado sigue
        accesible por URL directa, solo desaparece del navbar.
      </p>

      <NavOrderPanel initialItems={ordered} saveAction={saveNavOrder} renameAction={saveNavLabel} />

      <div className="mt-8">
        <CustomNavLinksPanel links={customLinks} createAction={createCustomNavLink} deleteAction={deleteCustomNavLink} />
      </div>
    </div>
  );
}

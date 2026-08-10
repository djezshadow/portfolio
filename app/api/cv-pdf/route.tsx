import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/profile";
import { CvDocument, type CvData, type CvEntry, type CvCategoryGroup } from "@/lib/pdf/cv-document";
import { loc } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/dictionaries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale: Locale = url.searchParams.get("locale") === "en" ? "en" : "es";

  const profile = await getProfile();

  if (!profile.cvEnabled) {
    return new Response("CV no disponible", { status: 404 });
  }

  const projects = await prisma.project.findMany({
    where: { publishedAt: { lte: new Date() } },
    orderBy: [{ isOngoing: "desc" }, { dateStart: "desc" }, { createdAt: "desc" }],
    include: {
      categories: { include: { category: true }, orderBy: { category: { order: "asc" } } },
      mediaGroups: { orderBy: { order: "asc" } },
    },
  });

  // Agrupa por categoría (item: "que se muestren los proyectos en su
  // categoría, y todas las subcategorías también") — cada proyecto lista
  // sus subcategorías (si tiene) pegadas al rol, en el subtítulo.
  const groupsByName = new Map<string, CvEntry[]>();
  for (const p of projects) {
    const categoryName = p.categories[0]?.category
      ? loc(p.categories[0].category.name, p.categories[0].category.nameEn, locale)
      : locale === "en"
        ? "Other"
        : "Otros";

    const subNames = p.mediaGroups.map((g) => loc(g.name, g.nameEn, locale));
    const subtitle =
      [loc(p.role || "", p.roleEn, locale) || null, subNames.length > 0 ? subNames.join(", ") : null]
        .filter(Boolean)
        .join(" — ") || null;

    const entry: CvEntry = {
      title: loc(p.title, p.titleEn, locale),
      subtitle,
      description: null,
      dateStart: p.dateStart,
      dateEnd: p.dateEnd,
      isOngoing: p.isOngoing,
    };

    const list = groupsByName.get(categoryName) ?? [];
    list.push(entry);
    groupsByName.set(categoryName, list);
  }
  const projectsByCategory: CvCategoryGroup[] = Array.from(groupsByName.entries()).map(
    ([categoryName, entries]) => ({ categoryName, entries })
  );

  const experienceEntries: CvEntry[] = profile.experiences.map((e) => ({
    title: loc(e.role, e.roleEn, locale),
    subtitle: e.company,
    description: loc(e.description || "", e.descriptionEn, locale) || null,
    dateStart: e.dateStart,
    dateEnd: e.dateEnd,
    isOngoing: e.isOngoing,
  }));

  const data: CvData = {
    fullName: profile.fullName || "DJEZSHADOW",
    specialty: loc(profile.specialty || "", profile.specialtyEn, locale) || null,
    bio: loc(profile.bio || "", profile.bioEn, locale) || null,
    photoUrl: profile.photoUrl,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    website: profile.website,
    instagram: profile.instagram,
    linkedin: profile.linkedin,
    skills: profile.skills.map((s) => loc(s.name, s.nameEn, locale)),
    experience: experienceEntries,
    projectsByCategory,
    locale,
  };

  const buffer = await renderToBuffer(<CvDocument data={data} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="djezshadow-cv.pdf"',
    },
  });
}

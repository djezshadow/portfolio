import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/profile";
import { CvDocument, type CvData, type CvEntry } from "@/lib/pdf/cv-document";
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
    include: { categories: { include: { category: true } } },
  });

  const projectEntries: CvEntry[] = projects.map((p) => ({
    title: loc(p.title, p.titleEn, locale),
    subtitle: [loc(p.role || "", p.roleEn, locale) || null, p.categories[0]?.category ? loc(p.categories[0].category.name, p.categories[0].category.nameEn, locale) : null]
      .filter(Boolean)
      .join(" · ") || null,
    description: null,
    dateStart: p.dateStart,
    dateEnd: p.dateEnd,
    isOngoing: p.isOngoing,
  }));

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
    skills: profile.skills.map((s) => loc(s.name, s.nameEn, locale)),
    experience: experienceEntries,
    projects: projectEntries,
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

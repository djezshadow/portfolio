import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.projectTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.media.deleteMany();
  await prisma.projectCategory.deleteMany();
  await prisma.project.deleteMany();
  await prisma.categoryStyle.deleteMany();
  await prisma.category.deleteMany();
  await prisma.collaborator.deleteMany();

  const cortos = await prisma.category.create({
    data: {
      slug: "cortometrajes",
      name: "Cortometrajes",
      order: 1,
      themeMode: "auto",
      style: {
        create: { fontFamily: "display", bold: false, alignment: "left" },
      },
    },
  });

  const musica = await prisma.category.create({
    data: {
      slug: "musica",
      name: "Música",
      order: 2,
      themeMode: "manual",
      themeName: "neon",
      style: {
        create: {
          fontFamily: "mono",
          bold: true,
          alignment: "center",
          accentColor: "#00e5ff",
        },
      },
    },
  });

  const collaborator = await prisma.collaborator.create({
    data: {
      name: "5 Voces Producciones",
      type: "creative",
      instagram: "https://instagram.com/5vocesproducciones",
    },
  });

  const proyecto1 = await prisma.project.create({
    data: {
      title: "Ideas Prestadas",
      description: "Cortometraje — dirección y montaje.",
      role: "Director / Editor",
      logoSource: "from_category",
      featured: true,
      publishedAt: new Date(),
      collaboratorId: collaborator.id,
      categories: { create: [{ categoryId: cortos.id }] },
      media: {
        create: [
          { type: "image", url: "/media/placeholder-1.webp", order: 0, isThumbnail: true },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      title: "Sesión en vivo — DJEZSHADOW",
      description: "Streaming musical, edición de reel vertical.",
      role: "Editor",
      logoSource: "none",
      featured: true,
      publishedAt: new Date(),
      categories: { create: [{ categoryId: musica.id }] },
      media: {
        create: [
          {
            type: "video",
            url: "",
            videoProvider: "youtube",
            videoId: "dQw4w9WgXcQ",
            order: 0,
          },
        ],
      },
    },
  });

  console.log("Seed OK:", { cortos: cortos.slug, musica: musica.slug, proyecto1: proyecto1.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

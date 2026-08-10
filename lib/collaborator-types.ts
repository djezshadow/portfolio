import { prisma } from "@/lib/prisma";

/**
 * Devuelve los tipos de relación (item #14). Si la tabla está vacía
 * (primera vez que corre esto después del `prisma db push`), la llena
 * con los dos tipos que ya existían como enum fijo — así no hace falta
 * un paso de seed manual y los colaboradores viejos (type="client" /
 * "creative") siguen encontrando su tipo.
 */
export async function getCollaboratorTypes() {
  const count = await prisma.collaboratorTypeOption.count();
  if (count === 0) {
    await prisma.collaboratorTypeOption.createMany({
      data: [
        { slug: "client", name: "Cliente", isClient: true, order: 0 },
        { slug: "creative", name: "Colaborador creativo", isClient: false, order: 1 },
      ],
      skipDuplicates: true,
    });
  }
  return prisma.collaboratorTypeOption.findMany({ orderBy: { order: "asc" } });
}

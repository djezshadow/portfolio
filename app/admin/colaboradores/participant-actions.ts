"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

async function assertAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("No autorizado");
}

function field(formData: FormData, name: string) {
  return (formData.get(name) as string)?.trim() || null;
}

export async function createParticipant(collaboratorId: string, formData: FormData) {
  await assertAdmin();

  const count = await prisma.participant.count({ where: { collaboratorId } });
  await prisma.participant.create({
    data: {
      collaboratorId,
      name: field(formData, "name"),
      role: field(formData, "role"),
      roleEn: field(formData, "roleEn"),
      instagram: field(formData, "instagram"),
      website: field(formData, "website"),
      order: count,
    },
  });

  revalidatePath(`/admin/colaboradores/${collaboratorId}`);
  revalidatePath("/", "layout");
}

export async function updateParticipant(participantId: string, formData: FormData) {
  await assertAdmin();

  const participant = await prisma.participant.update({
    where: { id: participantId },
    data: {
      name: field(formData, "name"),
      role: field(formData, "role"),
      roleEn: field(formData, "roleEn"),
      instagram: field(formData, "instagram"),
      website: field(formData, "website"),
    },
  });

  revalidatePath(`/admin/colaboradores/${participant.collaboratorId}`);
  revalidatePath("/", "layout");
}

export async function deleteParticipant(participantId: string, _formData: FormData) {
  await assertAdmin();

  const participant = await prisma.participant.delete({ where: { id: participantId } });

  revalidatePath(`/admin/colaboradores/${participant.collaboratorId}`);
  revalidatePath("/", "layout");
}

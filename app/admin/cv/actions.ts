"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
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

export async function updateProfile(formData: FormData) {
  await assertAdmin();

  const removePhoto = formData.get("removePhoto") === "on";
  const photo = formData.get("photo") as File | null;

  const current = await prisma.profile.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  let photoUrl = current.photoUrl;

  if (removePhoto && photoUrl) {
    try {
      await del(photoUrl);
    } catch {
      // ignorar
    }
    photoUrl = null;
  }

  if (photo && photo.size > 0) {
    if (current.photoUrl) {
      try {
        await del(current.photoUrl);
      } catch {
        // ignorar
      }
    }
    const buffer = Buffer.from(await photo.arrayBuffer());
    const webp = await sharp(buffer)
      .resize(600, 600, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
    const blob = await put(`profile/photo-${Date.now()}.webp`, webp, {
      access: "public",
      contentType: "image/webp",
    });
    photoUrl = blob.url;
  }

  await prisma.profile.update({
    where: { id: "default" },
    data: {
      fullName: field(formData, "fullName"),
      specialty: field(formData, "specialty"),
      specialtyEn: field(formData, "specialtyEn"),
      bio: field(formData, "bio"),
      bioEn: field(formData, "bioEn"),
      email: field(formData, "email"),
      phone: field(formData, "phone"),
      address: field(formData, "address"),
      website: field(formData, "website"),
      instagram: field(formData, "instagram"),
      linkedin: field(formData, "linkedin"),
      cvEnabled: formData.get("cvEnabled") === "on",
      photoUrl,
    },
  });

  revalidatePath("/admin/cv");
  revalidatePath("/", "layout");
}

export async function createSkill(formData: FormData) {
  await assertAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Falta el nombre de la aptitud.");
  const nameEn = field(formData, "nameEn");

  await prisma.profile.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  const count = await prisma.skill.count({ where: { profileId: "default" } });
  await prisma.skill.create({ data: { profileId: "default", name, nameEn, order: count } });

  revalidatePath("/admin/cv");
}

export async function deleteSkill(skillId: string, _formData: FormData) {
  await assertAdmin();
  await prisma.skill.delete({ where: { id: skillId } });
  revalidatePath("/admin/cv");
}

function parseDate(raw: FormDataEntryValue | null): Date | null {
  if (!raw || typeof raw !== "string" || !raw.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createExperience(formData: FormData) {
  await assertAdmin();
  const role = String(formData.get("role") ?? "").trim();
  if (!role) throw new Error("Falta el puesto/rol.");

  await prisma.profile.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  const count = await prisma.workExperience.count({ where: { profileId: "default" } });

  await prisma.workExperience.create({
    data: {
      profileId: "default",
      role,
      roleEn: field(formData, "roleEn"),
      company: field(formData, "company"),
      description: field(formData, "description"),
      descriptionEn: field(formData, "descriptionEn"),
      dateStart: parseDate(formData.get("dateStart")),
      dateEnd: parseDate(formData.get("dateEnd")),
      isOngoing: formData.get("isOngoing") === "on",
      order: count,
    },
  });

  revalidatePath("/admin/cv");
}

export async function updateExperience(experienceId: string, formData: FormData) {
  await assertAdmin();
  const role = String(formData.get("role") ?? "").trim();
  if (!role) throw new Error("Falta el puesto/rol.");

  await prisma.workExperience.update({
    where: { id: experienceId },
    data: {
      role,
      roleEn: field(formData, "roleEn"),
      company: field(formData, "company"),
      description: field(formData, "description"),
      descriptionEn: field(formData, "descriptionEn"),
      dateStart: parseDate(formData.get("dateStart")),
      dateEnd: parseDate(formData.get("dateEnd")),
      isOngoing: formData.get("isOngoing") === "on",
    },
  });

  revalidatePath("/admin/cv");
}

export async function deleteExperience(experienceId: string, _formData: FormData) {
  await assertAdmin();
  await prisma.workExperience.delete({ where: { id: experienceId } });
  revalidatePath("/admin/cv");
}

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

export async function saveNavOrder(orderedKeys: string[]) {
  await assertAdmin();

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { navOrder: JSON.stringify(orderedKeys) },
    create: { id: "default", navOrder: JSON.stringify(orderedKeys) },
  });

  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}

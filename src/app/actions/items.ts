"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createItemSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function createItem(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "No autenticado" };
  }

  const packagingType = formData.get("packagingType") as string;
  const packs = parseInt(formData.get("packs") as string) || 0;
  const unitsPerPack = parseInt(formData.get("unitsPerPack") as string) || 1;
  const totalUnitsRaw = parseInt(formData.get("totalUnits") as string) || 0;

  const totalUnits =
    packagingType === "PACKAGED" ? packs * unitsPerPack : totalUnitsRaw;

  const parsed = createItemSchema.safeParse({
    moduleId: formData.get("moduleId") as string,
    name: formData.get("name") as string,
    packagingType,
    packs,
    unitsPerPack,
    totalUnits,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  await prisma.item.create({
    data: {
      moduleId: parsed.data.moduleId,
      name: parsed.data.name,
      packagingType: parsed.data.packagingType,
      packs: parsed.data.packs,
      unitsPerPack: parsed.data.unitsPerPack,
      totalUnits,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteItem(itemId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "No autenticado" };
  }

  await prisma.item.delete({
    where: { id: itemId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getItemsByModule(moduleId: string) {
  return prisma.item.findMany({
    where: { moduleId },
    orderBy: { createdAt: "asc" },
  });
}

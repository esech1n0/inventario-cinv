"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createItemSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function createItem(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autenticado. Por favor inicia sesión de nuevo." };
    }

    const packagingType = formData.get("packagingType") as string;
    const packs = parseInt(formData.get("packs") as string, 10) || 0;
    const unitsPerPack = parseInt(formData.get("unitsPerPack") as string, 10) || 1;
    const totalUnitsRaw = parseInt(formData.get("totalUnits") as string, 10) || 0;

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
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Datos inválidos",
      };
    }

    const newItem = await prisma.item.create({
      data: {
        moduleId: parsed.data.moduleId,
        name: parsed.data.name,
        packagingType: parsed.data.packagingType,
        packs: parsed.data.packs,
        unitsPerPack: parsed.data.unitsPerPack,
        totalUnits,
      },
      include: {
        module: {
          select: { id: true, name: true },
        },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/modules");
    return {
      success: true,
      data: {
        ...newItem,
        createdAt: newItem.createdAt.toISOString(),
        updatedAt: newItem.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Error al crear artículo:", error);
    return {
      success: false,
      error: error?.message || "Error al registrar el artículo en la base de datos",
    };
  }
}

export async function deleteItem(itemId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autenticado. Por favor inicia sesión de nuevo." };
    }

    const existing = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      return { success: false, error: "El artículo ya no existe en el inventario" };
    }

    await prisma.item.delete({
      where: { id: itemId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/modules");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar artículo:", error);
    return {
      success: false,
      error: error?.message || "Error al eliminar el artículo de la base de datos",
    };
  }
}

export async function getItemsByModule(moduleId: string) {
  return prisma.item.findMany({
    where: { moduleId },
    orderBy: { createdAt: "asc" },
  });
}

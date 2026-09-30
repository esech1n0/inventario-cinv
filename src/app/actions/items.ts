"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createItemSchema, updateItemSchema } from "@/lib/validations";
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
    revalidatePath("/dashboard/categories");
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

export async function updateItem(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Solo los administradores pueden editar artículos directamente",
      };
    }

    const itemId = formData.get("itemId") as string;
    const moduleId = formData.get("moduleId") as string;
    const name = formData.get("name") as string;
    const packagingType = formData.get("packagingType") as string;
    const packs = parseInt(formData.get("packs") as string, 10) || 0;
    const unitsPerPack = parseInt(formData.get("unitsPerPack") as string, 10) || 1;
    const totalUnitsRaw = parseInt(formData.get("totalUnits") as string, 10) || 0;

    const totalUnits =
      packagingType === "PACKAGED" ? packs * unitsPerPack : totalUnitsRaw;

    const parsed = updateItemSchema.safeParse({
      itemId,
      moduleId,
      name,
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

    const existing = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      return { success: false, error: "El artículo no existe en el inventario" };
    }

    // Actualización directa de artículo por Admin: no genera registro en Transaction (no aparece en reporte de movimientos)
    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        moduleId: parsed.data.moduleId,
        name: parsed.data.name,
        packagingType: parsed.data.packagingType,
        packs: parsed.data.packs,
        unitsPerPack: parsed.data.unitsPerPack,
        totalUnits: parsed.data.totalUnits,
      },
      include: {
        module: {
          select: { id: true, name: true },
        },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/modules");
    revalidatePath("/dashboard/categories");

    return {
      success: true,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Error al actualizar artículo:", error);
    return {
      success: false,
      error: error?.message || "Error al actualizar el artículo en la base de datos",
    };
  }
}

export async function deleteItem(itemId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Solo los administradores pueden eliminar artículos del inventario",
      };
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
    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Error al eliminar el artículo de la base de datos";
    console.error("Error al eliminar artículo:", errMessage);
    return {
      success: false,
      error: errMessage,
    };
  }
}

export async function getItemsByModule(moduleId: string) {
  return prisma.item.findMany({
    where: { moduleId },
    orderBy: { createdAt: "asc" },
  });
}

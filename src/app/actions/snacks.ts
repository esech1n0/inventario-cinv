"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getWeekKey } from "@/lib/week";

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type SnackSettings = {
  weeklySnackLimit: number;
  snackModuleId: string | null;
};

const DEFAULT_LIMIT = 3;

export async function getSnackSettings(): Promise<SnackSettings> {
  const s = await prisma.appSettings.findUnique({ where: { id: 1 } });
  return {
    weeklySnackLimit: s?.weeklySnackLimit ?? DEFAULT_LIMIT,
    snackModuleId: s?.snackModuleId ?? null,
  };
}

const settingsSchema = z.object({
  weeklySnackLimit: z
    .number()
    .int("Debe ser un n\u00famero entero")
    .min(1, "El m\u00ednimo es 1 snack")
    .max(50, "El m\u00e1ximo es 50 snacks"),
  snackModuleId: z.string().min(1).nullable(),
});

/** El administrador define cu\u00e1ntos snacks por semana y qu\u00e9 categor\u00eda los contiene. */
export async function updateSnackSettings(input: SnackSettings): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Solo los administradores pueden cambiar esta configuraci\u00f3n" };
  }
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Datos no v\u00e1lidos" };
  }

  try {
    if (parsed.data.snackModuleId) {
      const exists = await prisma.module.findUnique({ where: { id: parsed.data.snackModuleId } });
      if (!exists) return { success: false, error: "La categor\u00eda seleccionada no existe" };
    }
    await prisma.appSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...parsed.data },
      update: parsed.data,
    });
    revalidatePath("/dashboard/snacks");
    revalidatePath("/dashboard/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar configuraci\u00f3n de snacks:", error);
    return { success: false, error: "Ha ocurrido un error" };
  }
}

const selectionSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1, "Escoge al menos un snack"),
});

/**
 * Guarda la selecci\u00f3n semanal del usuario. Solo se puede guardar una vez por semana.
 * Aparta los snacks (valida disponibilidad) pero NO descuenta stock todav\u00eda.
 */
export async function saveWeeklySnacks(itemIds: string[]): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };
  const userId = session.user.id;

  const parsed = selectionSchema.safeParse({ itemIds });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Datos no v\u00e1lidos" };
  }

  const weekKey = getWeekKey();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const settings = await tx.appSettings.findUnique({ where: { id: 1 } });
      const limit = settings?.weeklySnackLimit ?? DEFAULT_LIMIT;
      const moduleId = settings?.snackModuleId;
      if (!moduleId) {
        return { success: false, error: "El administrador a\u00fan no configura la categor\u00eda de snacks" };
      }
      if (parsed.data.itemIds.length > limit) {
        return { success: false, error: `Solo puedes escoger ${limit} snack(s) por semana` };
      }

      const already = await tx.snackSelection.count({ where: { userId, weekKey } });
      if (already > 0) {
        return { success: false, error: "Ya guardaste tu selecci\u00f3n de esta semana" };
      }

      // Cantidad solicitada por art\u00edculo
      const wanted = new Map<string, number>();
      for (const id of parsed.data.itemIds) wanted.set(id, (wanted.get(id) ?? 0) + 1);

      const items = await tx.item.findMany({
        where: { id: { in: [...wanted.keys()] }, moduleId },
        select: { id: true, name: true, totalUnits: true },
      });
      if (items.length !== wanted.size) {
        return { success: false, error: "Alguno de los snacks ya no est\u00e1 disponible" };
      }

      // Unidades ya apartadas (no tomadas) por otros usuarios esta semana
      const reserved = await tx.snackSelection.groupBy({
        by: ["itemId"],
        where: { weekKey, takenAt: null, itemId: { in: [...wanted.keys()] } },
        _count: { _all: true },
      });
      const reservedMap = new Map(reserved.map((r) => [r.itemId, r._count._all]));

      for (const item of items) {
        const available = item.totalUnits - (reservedMap.get(item.id) ?? 0);
        const qty = wanted.get(item.id)!;
        if (qty > available) {
          return {
            success: false,
            error: `No hay suficientes "${item.name}". Disponibles: ${Math.max(available, 0)}`,
          };
        }
      }

      await tx.snackSelection.createMany({
        data: parsed.data.itemIds.map((itemId) => ({ userId, itemId, weekKey })),
      });
      return { success: true };
    });

    if (result.success) revalidatePath("/dashboard/snacks");
    return result;
  } catch (error) {
    console.error("Error al guardar snacks semanales:", error);
    return { success: false, error: "Ha ocurrido un error" };
  }
}

/** Marca un snack apartado como tomado y descuenta 1 unidad del inventario. */
export async function takeSnack(selectionId: string): Promise<ActionResult<{ takenAt: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };
  const userId = session.user.id;
  if (!selectionId) return { success: false, error: "Datos no v\u00e1lidos" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sel = await tx.snackSelection.findUnique({
        where: { id: selectionId },
        include: { item: true },
      });
      if (!sel || sel.userId !== userId) {
        return { success: false as const, error: "Snack no encontrado" };
      }
      if (sel.weekKey !== getWeekKey()) {
        return { success: false as const, error: "Este snack pertenece a otra semana" };
      }

      const takenAt = new Date();
      // Marcado at\u00f3mico: evita tomar el mismo snack dos veces
      const marked = await tx.snackSelection.updateMany({
        where: { id: selectionId, takenAt: null },
        data: { takenAt },
      });
      if (marked.count === 0) {
        return { success: false as const, error: "Este snack ya fue tomado" };
      }

      const dec = await tx.item.updateMany({
        where: { id: sel.itemId, totalUnits: { gte: 1 } },
        data: { totalUnits: { decrement: 1 } },
      });
      if (dec.count === 0) {
        throw new Error("SIN_STOCK");
      }

      const item = sel.item;
      if (item.packagingType === "PACKAGED" && item.unitsPerPack > 0) {
        await tx.item.update({
          where: { id: item.id },
          data: { packs: Math.floor((item.totalUnits - 1) / item.unitsPerPack) },
        });
      }

      await tx.transaction.create({
        data: {
          itemId: item.id,
          userId,
          transactionType: "OUT",
          quantity: 1,
          motive: "Snack semanal",
        },
      });

      return { success: true as const, data: { takenAt: takenAt.toISOString() } };
    });

    if (result.success) {
      revalidatePath("/dashboard/snacks");
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/history");
    }
    return result;
  } catch (error) {
    if (error instanceof Error && error.message === "SIN_STOCK") {
      return { success: false, error: "Ya no hay existencias de este snack en el inventario" };
    }
    console.error("Error al tomar snack:", error);
    return { success: false, error: "Ha ocurrido un error" };
  }
}

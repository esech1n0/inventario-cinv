"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createTransactionSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import {
  sendPushNotificationToUser,
  broadcastPushNotification,
} from "@/lib/push-notifications";

export type ActionResult = {
  success: boolean;
  error?: string;
  newStock?: number;
};

export async function createTransaction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado. Por favor inicia sesión de nuevo." };
    }

    const rawQty = formData.get("quantity");
    const quantity = typeof rawQty === "string" ? parseInt(rawQty, 10) : Number(rawQty);

    const parsed = createTransactionSchema.safeParse({
      itemId: formData.get("itemId") as string,
      transactionType: formData.get("transactionType") as string,
      quantity,
      motive: formData.get("motive") as string,
      eventName: (formData.get("eventName") as string) || undefined,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Datos inválidos",
      };
    }

    const { itemId, transactionType, motive, eventName } = parsed.data;

    // Transacción atómica en Prisma
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: { module: true },
      });

      if (!item) {
        return { success: false as const, error: "Artículo no encontrado" };
      }

      let newTotalUnits = item.totalUnits;
      let newPacks = item.packs;

      if (transactionType === "OUT") {
        newTotalUnits -= quantity;
        if (newTotalUnits < 0) {
          return {
            success: false as const,
            error: `Stock insuficiente. Disponible: ${item.totalUnits} unidades`,
          };
        }
        if (item.packagingType === "PACKAGED" && item.unitsPerPack > 0) {
          newPacks = Math.floor(newTotalUnits / item.unitsPerPack);
        }
      } else {
        newTotalUnits += quantity;
        if (item.packagingType === "PACKAGED" && item.unitsPerPack > 0) {
          newPacks = Math.floor(newTotalUnits / item.unitsPerPack);
        }
      }

      await tx.item.update({
        where: { id: itemId },
        data: { totalUnits: newTotalUnits, packs: newPacks },
      });

      await tx.transaction.create({
        data: {
          itemId,
          userId: session.user.id,
          transactionType,
          quantity,
          motive,
          eventName: eventName || null,
        },
      });

      return {
        success: true as const,
        newStock: newTotalUnits,
        itemName: item.name,
        packagingType: item.packagingType,
      };
    });

    if (result.success) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/history");

      // Notificaciones Push con manejo seguro de errores
      try {
        const typeLabel = transactionType === "OUT" ? "Retiro" : "Ingreso";
        await sendPushNotificationToUser(session.user.id, {
          title: `Movimiento: ${typeLabel} confirmado`,
          body: `${typeLabel} de ${quantity} unidad(es) de ${result.itemName}. Motivo: ${motive}${
            eventName ? ` (${eventName})` : ""
          }`,
          url: "/dashboard/history",
        });

        if (transactionType === "OUT" && result.newStock !== undefined && result.newStock <= 5) {
          await broadcastPushNotification({
            title: `⚠️ Alerta: Stock Bajo`,
            body: `El artículo "${result.itemName}" ahora tiene solo ${result.newStock} unidad(es) disponibles.`,
            url: "/dashboard",
          });
        }
      } catch (e) {
        console.error("Error enviando push tras transacción:", e);
      }

      return { success: true, newStock: result.newStock };
    }

    return { success: false, error: result.error };
  } catch (error: any) {
    console.error("Error en createTransaction:", error);
    return {
      success: false,
      error: error?.message || "Error al procesar el movimiento en la base de datos",
    };
  }
}

export async function getTransactions(filters?: {
  itemId?: string;
  userId?: string;
  moduleId?: string;
  limit?: number;
}) {
  return prisma.transaction.findMany({
    where: {
      ...(filters?.itemId && { itemId: filters.itemId }),
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.moduleId && {
        item: { moduleId: filters.moduleId },
      }),
    },
    include: {
      item: { include: { module: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 100,
  });
}

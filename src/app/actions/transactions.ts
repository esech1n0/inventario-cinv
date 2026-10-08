"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createTransactionSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import {
  sendPushNotificationToUser,
  broadcastPushNotification,
} from "@/lib/push-notifications";
import { getWeekKey, getNextWeekKey } from "@/lib/week";

export type ActionResult = {
  success: boolean;
  error?: string;
  newStock?: number;
  snackNotice?: {
    isSnack: boolean;
    quantity: number;
    limit: number;
    currentWeekTaken: number;
    exceeded: boolean;
    excessCount: number;
    message: string;
  };
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

    // Transacción atómica en Prisma con defensa contra condiciones de carrera (TOCTOU)
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
        // Actualización condicional atómica: garantiza que no baje de 0 incluso bajo concurrencia
        const updateCount = await tx.item.updateMany({
          where: {
            id: itemId,
            totalUnits: { gte: quantity },
          },
          data: {
            totalUnits: { decrement: quantity },
          },
        });

        if (updateCount.count === 0) {
          return {
            success: false as const,
            error: `Stock insuficiente. Disponible: ${item.totalUnits} unidades`,
          };
        }

        newTotalUnits = item.totalUnits - quantity;
        if (item.packagingType === "PACKAGED" && item.unitsPerPack > 0) {
          newPacks = Math.floor(newTotalUnits / item.unitsPerPack);
          await tx.item.update({
            where: { id: itemId },
            data: { packs: newPacks },
          });
        }
      } else {
        newTotalUnits += quantity;
        if (item.packagingType === "PACKAGED" && item.unitsPerPack > 0) {
          newPacks = Math.floor(newTotalUnits / item.unitsPerPack);
        }
        await tx.item.update({
          where: { id: itemId },
          data: { totalUnits: newTotalUnits, packs: newPacks },
        });
      }

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

      // Lógica de vinculación con Snacks Semanales cuando se retira 'Para mi'
      let snackNotice: ActionResult["snackNotice"] = undefined;

      if (transactionType === "OUT" && motive === "Para mi") {
        const settings = await tx.appSettings.findUnique({ where: { id: 1 } });
        if (settings?.snackModuleId && item.moduleId === settings.snackModuleId) {
          const limit = settings.weeklySnackLimit || 3;
          const currentWeekKey = getWeekKey();
          const now = new Date();

          // Contar snacks tomados en la semana actual
          const currentTakenCount = await tx.snackSelection.count({
            where: { userId: session.user.id, weekKey: currentWeekKey, takenAt: { not: null } },
          });

          // Selecciones pendientes sin tomar de la semana actual
          const pendingSelections = await tx.snackSelection.findMany({
            where: { userId: session.user.id, weekKey: currentWeekKey, takenAt: null },
            orderBy: { createdAt: "asc" },
          });

          // Espacio restante en la semana actual
          const availableSlotsInCurrentWeek = Math.max(limit - currentTakenCount, 0);
          const takeInCurrentWeek = Math.min(quantity, availableSlotsInCurrentWeek);
          const excessCount = quantity - takeInCurrentWeek;

          // Asignar en la semana actual
          let remainingCurrent = takeInCurrentWeek;
          for (const pending of pendingSelections) {
            if (remainingCurrent <= 0) break;
            await tx.snackSelection.update({
              where: { id: pending.id },
              data: { takenAt: now, itemId },
            });
            remainingCurrent--;
          }

          if (remainingCurrent > 0) {
            const currentData = Array.from({ length: remainingCurrent }).map(() => ({
              userId: session.user.id,
              itemId,
              weekKey: currentWeekKey,
              takenAt: now,
            }));
            await tx.snackSelection.createMany({ data: currentData });
          }

          // Si excedió el límite, distribuir el excedente a semanas posteriores
          if (excessCount > 0) {
            // Eliminar apartados pendientes que ya no podrá tomar esta semana
            await tx.snackSelection.deleteMany({
              where: { userId: session.user.id, weekKey: currentWeekKey, takenAt: null },
            });

            let remainingExcess = excessCount;
            let weeksAhead = 1;

            while (remainingExcess > 0) {
              const targetWeekKey = getNextWeekKey(currentWeekKey, weeksAhead);
              const targetCount = await tx.snackSelection.count({
                where: { userId: session.user.id, weekKey: targetWeekKey },
              });
              const targetSlots = Math.max(limit - targetCount, 0);
              const toPlace = targetSlots > 0 ? Math.min(remainingExcess, targetSlots) : (weeksAhead >= 10 ? remainingExcess : 0);

              if (toPlace > 0) {
                const futureData = Array.from({ length: toPlace }).map(() => ({
                  userId: session.user.id,
                  itemId,
                  weekKey: targetWeekKey,
                  takenAt: now,
                }));
                await tx.snackSelection.createMany({ data: futureData });
                remainingExcess -= toPlace;
              }
              weeksAhead++;
            }
          }

          const exceeded = excessCount > 0;
          const message = exceeded
            ? `Has superado el límite semanal de snacks (${limit} permitidos). No podrás tomar más snacks en la semana y los ${excessCount} que tomaste de más se verán reflejados cuando se reinicie el conteo de snacks en la semana posterior.`
            : `Se registró como snack semanal (${currentTakenCount + takeInCurrentWeek} de ${limit} tomados esta semana).`;

          snackNotice = {
            isSnack: true,
            quantity,
            limit,
            currentWeekTaken: currentTakenCount + takeInCurrentWeek,
            exceeded,
            excessCount,
            message,
          };
        }
      }

      return {
        success: true as const,
        newStock: newTotalUnits,
        itemName: item.name,
        packagingType: item.packagingType,
        snackNotice,
      };
    });

    if (result.success) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/history");
      if (result.snackNotice) {
        revalidatePath("/dashboard/snacks");
      }

      // Notificaciones Push con manejo seguro de errores
      try {
        const typeLabel = transactionType === "OUT" ? "Retiro" : "Ingreso";
        await sendPushNotificationToUser(session.user.id, {
          title: `Movimiento: ${typeLabel} confirmado`,
          body: `${typeLabel} de ${quantity} unidad(es) de ${result.itemName}. Motivo: ${motive}${
            eventName ? ` (${eventName})` : ""
          }`,
          url: session.user.role === "ADMIN" ? "/dashboard/history" : "/dashboard",
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

      return { success: true, newStock: result.newStock, snackNotice: result.snackNotice };
    }

    return { success: false, error: result.error };
  } catch (error: unknown) {
    console.error("Error en createTransaction:", error);
    return {
      success: false,
      error: "Ha ocurrido un error",
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

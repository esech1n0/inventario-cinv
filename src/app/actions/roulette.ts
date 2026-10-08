"use server";

import { randomInt } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type RouletteUser = {
  id: string;
  name: string;
  email: string;
  rouletteEnabled: boolean;
  rouletteDrawn: boolean;
};

export type RouletteDrawEntry = {
  id: string;
  userName: string;
  drawnByName: string;
  createdAt: string;
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session.user;
}

const toggleSchema = z.object({
  userId: z.string().min(1),
  enabled: z.boolean(),
});

/** Agrega o quita a un usuario de la ruleta. */
export async function setRouletteParticipation(
  userId: string,
  enabled: boolean
): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { success: false, error: "Solo los administradores pueden modificar la ruleta" };
  }
  const parsed = toggleSchema.safeParse({ userId, enabled });
  if (!parsed.success) return { success: false, error: "Datos no válidos" };

  try {
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { rouletteEnabled: parsed.data.enabled },
    });
    revalidatePath("/dashboard/ruleta");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar participación en ruleta:", error);
    return { success: false, error: "Ha ocurrido un error" };
  }
}

/**
 * Gira la ruleta: elige aleatoriamente (en el servidor) entre los participantes
 * que aún no han tenido turno en la ronda actual. Si todos ya participaron,
 * se inicia una nueva ronda automáticamente.
 */
export async function spinRoulette(): Promise<
  ActionResult<{ winnerId: string; candidateIds: string[]; newRound: boolean }>
> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Solo los administradores pueden girar la ruleta" };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      let newRound = false;
      let candidates = await tx.user.findMany({
        where: { rouletteEnabled: true, rouletteDrawn: false },
        select: { id: true },
        orderBy: { name: "asc" },
      });

      if (candidates.length === 0) {
        const participants = await tx.user.count({ where: { rouletteEnabled: true } });
        if (participants === 0) {
          return { success: false, error: "No hay usuarios seleccionados en la ruleta" };
        }
        await tx.user.updateMany({ data: { rouletteDrawn: false } });
        newRound = true;
        candidates = await tx.user.findMany({
          where: { rouletteEnabled: true },
          select: { id: true },
          orderBy: { name: "asc" },
        });
      }

      const winner = candidates[randomInt(candidates.length)];
      await tx.user.update({ where: { id: winner.id }, data: { rouletteDrawn: true } });
      await tx.rouletteDraw.create({ data: { userId: winner.id, drawnById: admin.id! } });

      revalidatePath("/dashboard/ruleta");
      return {
        success: true,
        data: { winnerId: winner.id, candidateIds: candidates.map((c) => c.id), newRound },
      };
    });
  } catch (error) {
    console.error("Error al girar la ruleta:", error);
    return { success: false, error: "Ha ocurrido un error" };
  }
}

/** Reinicia manualmente la ronda (todos vuelven a estar disponibles). */
export async function resetRouletteRound(): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { success: false, error: "Solo los administradores pueden reiniciar la ruleta" };
  }
  try {
    await prisma.user.updateMany({ data: { rouletteDrawn: false } });
    revalidatePath("/dashboard/ruleta");
    return { success: true };
  } catch (error) {
    console.error("Error al reiniciar la ruleta:", error);
    return { success: false, error: "Ha ocurrido un error" };
  }
}

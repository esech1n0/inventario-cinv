"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createModuleSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function createModule(formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autenticado. Por favor inicia sesión de nuevo." };
    }

    const parsed = createModuleSchema.safeParse({
      name: formData.get("name") as string,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Datos inválidos",
      };
    }

    const existing = await prisma.module.findUnique({
      where: { name: parsed.data.name },
    });

    if (existing) {
      return { success: false, error: "Ya existe una categoría con ese nombre" };
    }

    await prisma.module.create({
      data: { name: parsed.data.name },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/modules");
    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Error al crear categoría:", error);
    return {
      success: false,
      error: error?.message || "Error al registrar la categoría en la base de datos",
    };
  }
}

export async function deleteModule(moduleId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Solo los administradores pueden eliminar categorías",
      };
    }

    await prisma.module.delete({
      where: { id: moduleId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/modules");
    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar categoría:", error);
    return {
      success: false,
      error: error?.message || "Error al eliminar la categoría en la base de datos",
    };
  }
}

export async function updateModule(
  moduleId: string,
  newName: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Solo los administradores pueden editar categorías",
      };
    }

    const trimmed = newName.trim();
    if (!trimmed) {
      return { success: false, error: "El nombre de la categoría no puede estar vacío" };
    }

    const existing = await prisma.module.findUnique({
      where: { name: trimmed },
    });

    if (existing && existing.id !== moduleId) {
      return { success: false, error: "Ya existe otra categoría con ese nombre" };
    }

    await prisma.module.update({
      where: { id: moduleId },
      data: { name: trimmed },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/modules");
    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar categoría:", error);
    return {
      success: false,
      error: error?.message || "Error al actualizar la categoría en la base de datos",
    };
  }
}

export async function getModules() {
  return prisma.module.findMany({
    include: {
      items: true,
    },
    orderBy: { createdAt: "asc" },
  });
}


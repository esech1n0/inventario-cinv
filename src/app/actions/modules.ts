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
      return { success: false, error: "Ya existe un módulo con ese nombre" };
    }

    await prisma.module.create({
      data: { name: parsed.data.name },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/modules");
    return { success: true };
  } catch (error: any) {
    console.error("Error al crear módulo:", error);
    return {
      success: false,
      error: error?.message || "Error al registrar el módulo en la base de datos",
    };
  }
}

export async function deleteModule(moduleId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Solo los administradores pueden eliminar módulos",
      };
    }

    await prisma.module.delete({
      where: { id: moduleId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/modules");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar módulo:", error);
    return {
      success: false,
      error: error?.message || "Error al eliminar el módulo en la base de datos",
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

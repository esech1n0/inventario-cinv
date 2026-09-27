"use server";

import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { adminChangePasswordSchema, updateRoleSchema } from "@/lib/validations";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function getUsers() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return [];
  }

  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateUserRole(
  userId: string,
  newRole: "ADMIN" | "USER"
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Solo los administradores pueden cambiar roles" };
  }

  const parsed = updateRoleSchema.safeParse({ userId, role: newRole });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de rol no válidos",
    };
  }

  if (userId === session.user.id) {
    return {
      success: false,
      error: "No puedes cambiar tu propio rol de administrador para evitar perder el acceso",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    return { success: false, error: "Error al actualizar el rol del usuario" };
  }
}

export async function adminChangeUserPassword(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Solo los administradores pueden cambiar contraseñas de usuarios" };
  }

  const raw = {
    newPassword: formData.get("newPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = adminChangePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de contraseña no válidos",
    };
  }

  try {
    const passwordHash = await bcryptjs.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar contraseña por admin:", error);
    return { success: false, error: "Error al actualizar la contraseña del usuario" };
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Solo administradores" };
  }

  if (userId === session.user.id) {
    return { success: false, error: "No puedes eliminarte a ti mismo" };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}

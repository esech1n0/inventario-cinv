import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ConfiguracionClient } from "@/components/ConfiguracionClient";
import { prisma } from "@/lib/prisma";
export default async function ConfiguracionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const settings = await prisma.appSettings.findFirst();
  const rawCategories = await prisma.module.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  return (
    <ConfiguracionClient
      user={{
        name: session.user.name || "Usuario",
        email: session.user.email || "",
        role: session.user.role || "USER",
      }}
      snackSettings={{
        weeklySnackLimit: settings?.weeklySnackLimit ?? 3,
        snackModuleId: settings?.snackModuleId ?? null,
      }}
      categories={rawCategories}
    />
  );
}

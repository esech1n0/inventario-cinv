import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InventoryClient } from "@/components/InventoryClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let modules: { id: string; name: string }[] = [];
  let items: any[] = [];
  let dbError: string | null = null;

  try {
    const [fetchedModules, fetchedItems] = await Promise.all([
      prisma.module.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.item.findMany({
        orderBy: { name: "asc" },
        include: {
          module: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);
    modules = fetchedModules;
    items = fetchedItems;
  } catch (error: any) {
    console.error("Error al cargar datos en DashboardPage:", error);
    dbError = error?.message || "Error al conectar con la base de datos";
  }

  const serializedItems = items.map((item) => ({
    ...item,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
  }));

  return (
    <>
      {dbError && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <strong>Atención:</strong> No se pudo conectar a la base de datos ({dbError}). Verifica las variables de entorno en Vercel.
          </div>
        </div>
      )}
      <InventoryClient
        initialItems={serializedItems}
        modules={modules}
        userRole={session.user.role || "USER"}
      />
    </>
  );
}


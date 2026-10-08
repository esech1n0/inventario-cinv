import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HistoryClient } from "@/components/HistoryClient";
import type { InventoryLogEntry } from "@/components/InventoryLog";

export const metadata = {
  title: "Bitácora | Inventario CINV",
  description: "Movimientos de inventario y registro de inventariado semanal.",
};

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let serializedTransactions: any[] = [];
  let serializedDraws: InventoryLogEntry[] = [];
  let dbError: string | null = null;

  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        item: {
          include: {
            module: { select: { name: true } },
          },
        },
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      take: 100,
    });

    serializedTransactions = transactions.map((tx) => ({
      ...tx,
      createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
    }));

    const draws = await prisma.rouletteDraw.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true, email: true } },
        drawnBy: { select: { name: true } },
      },
    });
    serializedDraws = draws.map((d) => ({
      id: d.id,
      createdAt: d.createdAt.toISOString(),
      user: d.user,
      drawnBy: d.drawnBy,
    }));
  } catch (error: any) {
    console.error("Error al cargar historial en HistoryPage:", error);
    dbError = error?.message || "Error al conectar con la base de datos";
  }

  return (
    <>
      {dbError && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <strong>Atención:</strong> No se pudo cargar la bitácora ({dbError}).
          </div>
        </div>
      )}
      <HistoryClient
        initialTransactions={serializedTransactions}
        initialDraws={serializedDraws}
      />
    </>
  );
}

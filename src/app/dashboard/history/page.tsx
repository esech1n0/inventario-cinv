import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HistoryClient } from "@/components/HistoryClient";

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let serializedTransactions: any[] = [];
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
  } catch (error: any) {
    console.error("Error al cargar historial en HistoryPage:", error);
    dbError = error?.message || "Error al conectar con la base de datos";
  }

  return (
    <>
      {dbError && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <strong>Atención:</strong> No se pudo cargar el historial ({dbError}).
          </div>
        </div>
      )}
      <HistoryClient initialTransactions={serializedTransactions} />
    </>
  );
}

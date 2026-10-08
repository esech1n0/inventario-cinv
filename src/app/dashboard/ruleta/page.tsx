import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RouletteClient } from "@/components/RouletteClient";
import type { RouletteUser, RouletteDrawEntry } from "@/app/actions/roulette";

export const metadata = {
  title: "Ruleta de inventario | Inventario CINV",
  description: "Sorteo semanal para decidir quién realiza el inventario.",
};

export default async function RuletaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  let users: RouletteUser[] = [];
  let history: RouletteDrawEntry[] = [];
  let dbError: string | null = null;

  try {
    users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, rouletteEnabled: true, rouletteDrawn: true },
    });

    const draws = await prisma.rouletteDraw.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } }, drawnBy: { select: { name: true } } },
    });
    history = draws.map((d) => ({
      id: d.id,
      userName: d.user.name,
      drawnByName: d.drawnBy.name,
      createdAt: d.createdAt.toISOString(),
    }));
  } catch (error: unknown) {
    console.error("Error al cargar la ruleta:", error);
    dbError = error instanceof Error ? error.message : "Error al conectar con la base de datos";
  }

  return (
    <>
      {dbError && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
            <strong>Atención:</strong> No se pudo cargar la ruleta ({dbError}).
          </div>
        </div>
      )}
      <RouletteClient initialUsers={users} initialHistory={history} />
    </>
  );
}

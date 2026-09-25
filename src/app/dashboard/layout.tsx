import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/Navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation
        user={{
          name: session.user.name || "Usuario",
          email: session.user.email || "",
          role: session.user.role || "USER",
        }}
      />
      <main className="flex-1 pb-20 md:pb-8">{children}</main>
    </div>
  );
}

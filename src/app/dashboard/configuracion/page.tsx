import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ConfiguracionClient } from "@/components/ConfiguracionClient";

export default async function ConfiguracionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ConfiguracionClient
      user={{
        name: session.user.name || "Usuario",
        email: session.user.email || "",
        role: session.user.role || "USER",
      }}
    />
  );
}

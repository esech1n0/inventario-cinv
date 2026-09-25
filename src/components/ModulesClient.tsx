"use client";

import { useState } from "react";
import { Layers, Plus, Trash2, Box, Package, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { createModule, deleteModule } from "@/app/actions/modules";

interface ModuleWithCount {
  id: string;
  name: string;
  _count: {
    items: number;
  };
  totalUnits: number;
}

interface ModulesClientProps {
  initialModules: ModuleWithCount[];
  userRole: string;
}

export function ModulesClient({ initialModules, userRole }: ModulesClientProps) {
  const [modules, setModules] = useState<ModuleWithCount[]>(initialModules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = userRole === "ADMIN";

  async function handleCreateModule(e: React.FormEvent) {
    e.preventDefault();
    if (!newModuleName.trim()) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", newModuleName.trim());

    const res = await createModule(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Error al crear módulo");
    } else {
      setIsModalOpen(false);
      setNewModuleName("");
      setBanner({
        type: "success",
        text: `Módulo "${newModuleName.trim()}" creado correctamente.`,
      });
      setTimeout(() => setBanner(null), 4000);
      // Actualizar vista local
      window.location.reload();
    }
  }

  async function handleDeleteModule(moduleId: string, moduleName: string, itemsCount: number) {
    if (!isAdmin) {
      alert("Solo los administradores pueden eliminar módulos.");
      return;
    }

    const confirmMsg =
      itemsCount > 0
        ? `¡ADVERTENCIA! El módulo "${moduleName}" contiene ${itemsCount} artículo(s). Si lo eliminas, todos sus artículos y registros asociados serán eliminados permanentemente. ¿Deseas continuar?`
        : `¿Estás seguro de eliminar el módulo "${moduleName}"?`;

    if (!confirm(confirmMsg)) return;

    setModules((prev) => prev.filter((m) => m.id !== moduleId));

    const res = await deleteModule(moduleId);
    if (!res.success) {
      setBanner({
        type: "error",
        text: res.error || "No se pudo eliminar el módulo",
      });
      window.location.reload();
    } else {
      setBanner({
        type: "success",
        text: `Módulo "${moduleName}" eliminado con éxito.`,
      });
      setTimeout(() => setBanner(null), 4000);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {banner && (
        <div
          className={`animate-fade-in mb-6 flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${
            banner.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {banner.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{banner.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Módulos de Inventario
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Categorización dinámica de materiales y suministros
          </p>
        </div>

        {/* Botón disponible para TODOS los usuarios autenticados */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nuevo Módulo
        </button>
      </div>

      {/* Grid de Módulos */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="h-5 w-5" />
                </div>

                {/* Botón de eliminar: SOLO visible para ADMINISTRADORES (Regla de negocio estricta) */}
                {isAdmin ? (
                  <button
                    onClick={() => handleDeleteModule(mod.id, mod.name, mod._count.items)}
                    title="Eliminar módulo (Solo Admin)"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Módulo protegido
                  </span>
                )}
              </div>

              <h3 className="mt-4 text-lg font-bold text-foreground">{mod.name}</h3>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Box className="h-3.5 w-3.5" />
                  <span>{mod._count.items} artículos</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  <span>{mod.totalUnits} unidades</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nuevo Módulo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Crear Nuevo Módulo</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Ingresa el nombre para la nueva categoría de inventario
            </p>

            <form onSubmit={handleCreateModule} className="mt-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nombre del módulo *</label>
                <input
                  type="text"
                  required
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="Ej. Audio y Video, Robótica, Material Médico..."
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setError("");
                  }}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar Módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

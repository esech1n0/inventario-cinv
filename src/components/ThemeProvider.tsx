"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
});

const STORAGE_KEY = "cinv-theme";

function updateThemeInDOM(targetTheme: Theme): "light" | "dark" {
  if (typeof window === "undefined") return "dark";

  const isDark =
    targetTheme === "dark" ||
    (targetTheme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const resolved = isDark ? "dark" : "light";
  const root = document.documentElement;

  if (isDark) {
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }

  // Barra de notificaciones celular: #1e293b en oscuro (color hover), #f1f5f9 en claro (color hover)
  const hoverColor = isDark ? "#1e293b" : "#f1f5f9";
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (metas.length > 0) {
    metas.forEach((meta) => meta.setAttribute("content", hoverColor));
  } else {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", hoverColor);
    document.head.appendChild(meta);
  }

  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Lectura inicial del almacenamiento local. Por defecto "dark".
    const savedTheme = (localStorage.getItem(STORAGE_KEY) as Theme) || "dark";
    setThemeState(savedTheme);
    const resolved = updateThemeInDOM(savedTheme);
    setResolvedTheme(resolved);

    // Escuchar cambios de preferencia del sistema si el usuario seleccionó "system"
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as Theme) || "dark";
      if (current === "system") {
        const res = updateThemeInDOM("system");
        setResolvedTheme(res);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    // Sincronizar entre pestañas
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
        const res = updateThemeInDOM(newTheme);
        setResolvedTheme(res);
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    startTransition(() => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch (e) {
        console.error("Error guardando tema en localStorage:", e);
      }
      const res = updateThemeInDOM(newTheme);
      setResolvedTheme(res);
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

import { describe, it, expect } from "vitest";
import {
  createItemSchema,
  createModuleSchema,
  createTransactionSchema,
  registerSchema,
  loginSchema,
} from "@/lib/validations";

describe("Validaciones Zod - Reglas de Negocio", () => {
  describe("createModuleSchema", () => {
    it("debe validar un nombre de módulo válido", () => {
      const result = createModuleSchema.safeParse({ name: "Papelería" });
      expect(result.success).toBe(true);
    });

    it("debe rechazar nombres de módulo vacíos", () => {
      const result = createModuleSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("createItemSchema", () => {
    it("debe validar un artículo empaquetado", () => {
      const result = createItemSchema.safeParse({
        moduleId: "cl12345678901234567890123",
        name: "Hojas Blancas",
        packagingType: "PACKAGED",
        packs: 5,
        unitsPerPack: 500,
        totalUnits: 2500,
      });
      expect(result.success).toBe(true);
    });

    it("debe validar un artículo unitario", () => {
      const result = createItemSchema.safeParse({
        moduleId: "cl12345678901234567890123",
        name: "Cautín para soldar",
        packagingType: "UNITARY",
        packs: 0,
        unitsPerPack: 1,
        totalUnits: 4,
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar artículos sin nombre", () => {
      const result = createItemSchema.safeParse({
        moduleId: "cl12345678901234567890123",
        name: "",
        packagingType: "UNITARY",
        totalUnits: 5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createTransactionSchema", () => {
    it("debe validar una transacción de salida con motivo", () => {
      const result = createTransactionSchema.safeParse({
        itemId: "cl12345678901234567890123",
        transactionType: "OUT",
        quantity: 5,
        motive: "Uso general en laboratorio",
      });
      expect(result.success).toBe(true);
    });

    it("debe validar una transacción con evento", () => {
      const result = createTransactionSchema.safeParse({
        itemId: "cl12345678901234567890123",
        transactionType: "OUT",
        quantity: 10,
        motive: "Evento",
        eventName: "Hackathon CINV 2026",
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar cantidades menores a 1", () => {
      const result = createTransactionSchema.safeParse({
        itemId: "cl12345678901234567890123",
        transactionType: "OUT",
        quantity: 0,
        motive: "Prueba",
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar transacciones sin motivo", () => {
      const result = createTransactionSchema.safeParse({
        itemId: "cl12345678901234567890123",
        transactionType: "OUT",
        quantity: 2,
        motive: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("debe rechazar si las contraseñas no coinciden", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@cinv.org",
        password: "password123",
        confirmPassword: "password456",
      });
      expect(result.success).toBe(false);
    });

    it("debe aceptar registros válidos", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@cinv.org",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(true);
    });
  });
});

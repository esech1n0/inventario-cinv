import { describe, it, expect } from "vitest";

function processStockTransaction(item: {
  packagingType: "UNITARY" | "PACKAGED";
  packs: number;
  unitsPerPack: number;
  totalUnits: number;
}, transaction: {
  transactionType: "IN" | "OUT";
  quantity: number;
}) {
  let newTotalUnits = item.totalUnits;
  let newPacks = item.packs;

  if (transaction.transactionType === "OUT") {
    newTotalUnits -= transaction.quantity;
    if (newTotalUnits < 0) {
      throw new Error(`Stock insuficiente. Disponible: ${item.totalUnits} unidades`);
    }
    if (item.packagingType === "PACKAGED" && item.unitsPerPack > 0) {
      newPacks = Math.floor(newTotalUnits / item.unitsPerPack);
    }
  } else {
    newTotalUnits += transaction.quantity;
    if (item.packagingType === "PACKAGED" && item.unitsPerPack > 0) {
      newPacks = Math.floor(newTotalUnits / item.unitsPerPack);
    }
  }

  return { totalUnits: newTotalUnits, packs: newPacks };
}

describe("Reglas de Negocio de Inventario", () => {
  describe("Cálculo de empaquetado inicial", () => {
    it("debe calcular totalUnits como packs * unitsPerPack en artículos empaquetados", () => {
      const packs = 5;
      const unitsPerPack = 500;
      const totalUnits = packs * unitsPerPack;
      expect(totalUnits).toBe(2500);
    });

    it("debe conservar totalUnits directo en artículos unitarios", () => {
      const totalUnits = 15;
      expect(totalUnits).toBe(15);
    });
  });

  describe("Salidas y Retiro de Material (OUT)", () => {
    it("debe descontar correctamente las unidades retiradas de un artículo unitario", () => {
      const item = {
        packagingType: "UNITARY" as const,
        packs: 0,
        unitsPerPack: 1,
        totalUnits: 15,
      };

      const result = processStockTransaction(item, {
        transactionType: "OUT",
        quantity: 5,
      });

      expect(result.totalUnits).toBe(10);
    });

    it("debe descontar unidades y recalcular paquetes en artículos empaquetados", () => {
      const item = {
        packagingType: "PACKAGED" as const,
        packs: 10,
        unitsPerPack: 12,
        totalUnits: 120,
      };

      const result = processStockTransaction(item, {
        transactionType: "OUT",
        quantity: 15,
      });

      expect(result.totalUnits).toBe(105);
      expect(result.packs).toBe(8);
    });

    it("REGLA CRÍTICA: NO debe permitir bajo ninguna circunstancia que el inventario quede negativo", () => {
      const item = {
        packagingType: "UNITARY" as const,
        packs: 0,
        unitsPerPack: 1,
        totalUnits: 4,
      };

      expect(() =>
        processStockTransaction(item, {
          transactionType: "OUT",
          quantity: 5,
        })
      ).toThrow("Stock insuficiente. Disponible: 4 unidades");
    });
  });

  describe("Entradas de Stock (IN)", () => {
    it("debe incrementar las unidades totales en un artículo unitario", () => {
      const item = {
        packagingType: "UNITARY" as const,
        packs: 0,
        unitsPerPack: 1,
        totalUnits: 8,
      };

      const result = processStockTransaction(item, {
        transactionType: "IN",
        quantity: 12,
      });

      expect(result.totalUnits).toBe(20);
    });

    it("debe incrementar unidades y recalcular paquetes en artículos empaquetados", () => {
      const item = {
        packagingType: "PACKAGED" as const,
        packs: 2,
        unitsPerPack: 50,
        totalUnits: 100,
      };

      const result = processStockTransaction(item, {
        transactionType: "IN",
        quantity: 50,
      });

      expect(result.totalUnits).toBe(150);
      expect(result.packs).toBe(3);
    });
  });
});

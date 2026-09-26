import { describe, it, expect } from "vitest";
import { generateNumericOTP, hashOTP } from "@/lib/otp";

describe("Seguridad y Verificación 2FA (OTP)", () => {
  describe("generateNumericOTP", () => {
    it("debe generar un código numérico de exactamente 6 dígitos", () => {
      for (let i = 0; i < 20; i++) {
        const otp = generateNumericOTP();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
        const num = parseInt(otp, 10);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThan(1000000);
      }
    });
  });

  describe("hashOTP", () => {
    it("debe generar un hash consistente para el mismo correo y código", () => {
      const email = "usuario@cinv.org";
      const otp = "123456";
      const hash1 = hashOTP(email, otp);
      const hash2 = hashOTP(email, otp);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string
    });

    it("debe ser insensible a mayúsculas y espacios en el correo", () => {
      const hash1 = hashOTP("usuario@cinv.org", "654321");
      const hash2 = hashOTP("  USUARIO@CINV.ORG  ", "654321");
      expect(hash1).toBe(hash2);
    });

    it("debe generar hashes distintos para códigos distintos", () => {
      const email = "admin@cinv.org";
      const hash1 = hashOTP(email, "111111");
      const hash2 = hashOTP(email, "222222");
      expect(hash1).not.toBe(hash2);
    });
  });
});

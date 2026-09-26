import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de base de datos para ambiente de oficina...");

  // 1. Usuarios base
  const adminPassword = await bcryptjs.hash("Admin123!", 12);
  const userPassword = await bcryptjs.hash("User123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cinv.org" },
    update: {
      isApproved: true,
      role: "ADMIN",
    },
    create: {
      name: "Administrador CINV",
      email: "admin@cinv.org",
      passwordHash: adminPassword,
      role: "ADMIN",
      isApproved: true,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "usuario@cinv.org" },
    update: {
      isApproved: true,
      role: "USER",
    },
    create: {
      name: "Integrante CINV",
      email: "usuario@cinv.org",
      passwordHash: userPassword,
      role: "USER",
      isApproved: true,
    },
  });

  console.log("✅ Usuarios creados/actualizados:", admin.email, member.email);

  // 2. Módulos base de oficina (Papelería, Consumibles de Impresión, Equipo y Cómputo, Accesorios de Oficina)
  const baseModules = [
    {
      name: "Papelería",
      items: [
        {
          name: "Hojas Blancas Carta (Resmas)",
          packagingType: "PACKAGED" as const,
          packs: 10,
          unitsPerPack: 500,
          totalUnits: 5000,
        },
        {
          name: "Bolígrafos Azules (Caja)",
          packagingType: "PACKAGED" as const,
          packs: 8,
          unitsPerPack: 12,
          totalUnits: 96,
        },
        {
          name: "Bolígrafos Negros (Caja)",
          packagingType: "PACKAGED" as const,
          packs: 6,
          unitsPerPack: 12,
          totalUnits: 72,
        },
        {
          name: "Notas Adhesivas (Post-its)",
          packagingType: "PACKAGED" as const,
          packs: 20,
          unitsPerPack: 100,
          totalUnits: 2000,
        },
        {
          name: "Sellos de Coordinación",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 4,
        },
        {
          name: "Pegamento en Barra",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 15,
        },
      ],
    },
    {
      name: "Consumibles de Impresión",
      items: [
        {
          name: "Tóner HP LaserJet Negro",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 6,
        },
        {
          name: "Cartucho de Tinta Negra Epson",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 8,
        },
        {
          name: "Cartucho de Tinta Color Epson",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 8,
        },
        {
          name: "Tóner Brother TN-660",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 4,
        },
      ],
    },
    {
      name: "Equipo y Cómputo",
      items: [
        {
          name: "Laptops Dell Latitude",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 6,
        },
        {
          name: "Extensiones de Corriente (10m)",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 8,
        },
        {
          name: "Extensiones de Corriente (5m)",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 12,
        },
        {
          name: "Regletas Multicontacto con Supresor",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 10,
        },
      ],
    },
    {
      name: "Accesorios de Oficina",
      items: [
        {
          name: "Pilas Alcalinas AA (Paquete)",
          packagingType: "PACKAGED" as const,
          packs: 15,
          unitsPerPack: 4,
          totalUnits: 60,
        },
        {
          name: "Pilas Alcalinas AAA (Paquete)",
          packagingType: "PACKAGED" as const,
          packs: 15,
          unitsPerPack: 4,
          totalUnits: 60,
        },
        {
          name: "Grapadoras de Escritorio",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 8,
        },
        {
          name: "Cajas de Grapas Estándar",
          packagingType: "PACKAGED" as const,
          packs: 10,
          unitsPerPack: 1000,
          totalUnits: 10000,
        },
        {
          name: "Carpetas de Archivo Tamaño Carta",
          packagingType: "PACKAGED" as const,
          packs: 5,
          unitsPerPack: 25,
          totalUnits: 125,
        },
      ],
    },
  ];

  for (const mod of baseModules) {
    const createdModule = await prisma.module.upsert({
      where: { name: mod.name },
      update: {},
      create: { name: mod.name },
    });

    for (const item of mod.items) {
      const existingItem = await prisma.item.findFirst({
        where: { moduleId: createdModule.id, name: item.name },
      });

      if (!existingItem) {
        await prisma.item.create({
          data: {
            moduleId: createdModule.id,
            name: item.name,
            packagingType: item.packagingType,
            packs: item.packs,
            unitsPerPack: item.unitsPerPack,
            totalUnits: item.totalUnits,
          },
        });
      }
    }
  }

  console.log("✅ Módulos e items de oficina creados exitosamente.");
  console.log("🎉 Seed completado.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

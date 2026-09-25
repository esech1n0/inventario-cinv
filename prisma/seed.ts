import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de base de datos...");

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

  // 2. Módulos base (según INSTRUCTIONS.md: Papelería, Electrónicos, Herramientas, Componentes, Insumos)
  const baseModules = [
    {
      name: "Papelería",
      items: [
        {
          name: "Hojas Blancas Carta",
          packagingType: "PACKAGED" as const,
          packs: 5,
          unitsPerPack: 500,
          totalUnits: 2500,
        },
        {
          name: "Bolígrafos Azules",
          packagingType: "PACKAGED" as const,
          packs: 10,
          unitsPerPack: 12,
          totalUnits: 120,
        },
        {
          name: "Marcadores para Pizarrón",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 25,
        },
      ],
    },
    {
      name: "Electrónicos",
      items: [
        {
          name: "Cables USB-C a USB-A",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 15,
        },
        {
          name: "Cargadores 20W",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 8,
        },
        {
          name: "Adaptadores HDMI a VGA",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 6,
        },
      ],
    },
    {
      name: "Herramientas",
      items: [
        {
          name: "Kit de Destornilladores de Precisión",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 4,
        },
        {
          name: "Pinzas de Corte",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 5,
        },
        {
          name: "Multímetro Digital",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 3,
        },
      ],
    },
    {
      name: "Componentes",
      items: [
        {
          name: "Arduino Uno R3",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 12,
        },
        {
          name: "Resistencias 220 Ohm",
          packagingType: "PACKAGED" as const,
          packs: 20,
          unitsPerPack: 50,
          totalUnits: 1000,
        },
        {
          name: "Sensores Ultrasónicos HC-SR04",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 18,
        },
      ],
    },
    {
      name: "Insumos",
      items: [
        {
          name: "Soldadura de Estaño 60/40",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 10,
        },
        {
          name: "Cinta de Aislar",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 14,
        },
        {
          name: "Alcohol Isopropílico 1L",
          packagingType: "UNITARY" as const,
          packs: 0,
          unitsPerPack: 1,
          totalUnits: 5,
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

  console.log("✅ Módulos e items base creados exitosamente.");
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

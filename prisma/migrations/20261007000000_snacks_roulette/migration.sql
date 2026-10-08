-- Módulos: Ruleta de inventariado + Mis snacks + Configuración de app
-- Script idempotente: puede ejecutarse varias veces sin error.

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rouletteDrawn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rouletteEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE IF NOT EXISTS "roulette_draws" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drawnById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roulette_draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "weeklySnackLimit" INTEGER NOT NULL DEFAULT 3,
    "snackModuleId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "snack_selections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snack_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "snack_selections_userId_weekKey_idx" ON "snack_selections"("userId", "weekKey");
CREATE INDEX IF NOT EXISTS "snack_selections_weekKey_itemId_idx" ON "snack_selections"("weekKey", "itemId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roulette_draws_userId_fkey') THEN
        ALTER TABLE "roulette_draws" ADD CONSTRAINT "roulette_draws_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roulette_draws_drawnById_fkey') THEN
        ALTER TABLE "roulette_draws" ADD CONSTRAINT "roulette_draws_drawnById_fkey" FOREIGN KEY ("drawnById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'snack_selections_userId_fkey') THEN
        ALTER TABLE "snack_selections" ADD CONSTRAINT "snack_selections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'snack_selections_itemId_fkey') THEN
        ALTER TABLE "snack_selections" ADD CONSTRAINT "snack_selections_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

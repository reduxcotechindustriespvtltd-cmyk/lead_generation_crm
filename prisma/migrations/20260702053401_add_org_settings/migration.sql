-- CreateTable
CREATE TABLE "org_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL DEFAULT 'CRM',
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#c2410c',
    "secondaryColor" TEXT NOT NULL DEFAULT '#0d9488',
    "supportEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_settings_pkey" PRIMARY KEY ("id")
);

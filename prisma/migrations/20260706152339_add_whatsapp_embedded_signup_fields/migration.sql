-- CreateEnum
CREATE TYPE "WhatsAppConnectionMethod" AS ENUM ('MANUAL_TOKEN', 'EMBEDDED_SIGNUP');

-- AlterTable
ALTER TABLE "whatsapp_accounts" ADD COLUMN     "businessId" TEXT,
ADD COLUMN     "connectedVia" "WhatsAppConnectionMethod" NOT NULL DEFAULT 'MANUAL_TOKEN',
ADD COLUMN     "qualityRating" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "whatsapp_accounts_wabaId_idx" ON "whatsapp_accounts"("wabaId");

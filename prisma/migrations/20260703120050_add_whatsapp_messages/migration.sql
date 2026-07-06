-- CreateEnum
CREATE TYPE "WhatsAppMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('RECEIVED', 'SENT', 'FAILED');

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'WHATSAPP_REPLIED';

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "whatsAppAccountId" TEXT NOT NULL,
    "direction" "WhatsAppMessageDirection" NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "status" "WhatsAppMessageStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,
    "whatsAppMessageId" TEXT,
    "sentById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_whatsAppMessageId_key" ON "whatsapp_messages"("whatsAppMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_leadId_createdAt_idx" ON "whatsapp_messages"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_messages_whatsAppAccountId_idx" ON "whatsapp_messages"("whatsAppAccountId");

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_whatsAppAccountId_fkey" FOREIGN KEY ("whatsAppAccountId") REFERENCES "whatsapp_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

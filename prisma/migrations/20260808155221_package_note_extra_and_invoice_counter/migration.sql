-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "note" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "extraTitle" TEXT,
ADD COLUMN     "extraContent" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "invoiceNumber" TEXT;

-- CreateTable
CREATE TABLE "invoice_counters" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_invoiceNumber_key" ON "leads"("invoiceNumber");

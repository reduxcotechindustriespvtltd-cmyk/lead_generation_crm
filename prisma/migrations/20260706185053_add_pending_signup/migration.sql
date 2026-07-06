-- CreateTable
CREATE TABLE "pending_signups" (
    "id" TEXT NOT NULL,
    "merchantOrderId" TEXT NOT NULL,
    "merchantSubscriptionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "plan" "OrgPlan" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_signups_merchantOrderId_key" ON "pending_signups"("merchantOrderId");

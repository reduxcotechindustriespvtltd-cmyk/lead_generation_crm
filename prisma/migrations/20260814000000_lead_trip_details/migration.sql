-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "checkInDate" TIMESTAMP(3),
ADD COLUMN     "checkOutDate" TIMESTAMP(3),
ADD COLUMN     "guestsAdults" INTEGER,
ADD COLUMN     "guestsKids" INTEGER,
ADD COLUMN     "guestsInfants" INTEGER;

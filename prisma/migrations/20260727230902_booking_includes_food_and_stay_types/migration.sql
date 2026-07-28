-- AlterEnum
BEGIN;
CREATE TYPE "StayType_new" AS ENUM ('VILLA', 'TENT_CAMPING', 'COTTAGE', 'FARM_HOUSE', 'GLAMPING', 'RESORT');
ALTER TABLE "bookings" ALTER COLUMN "stayType" TYPE "StayType_new" USING ("stayType"::text::"StayType_new");
ALTER TYPE "StayType" RENAME TO "StayType_old";
ALTER TYPE "StayType_new" RENAME TO "StayType";
DROP TYPE "public"."StayType_old";
COMMIT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "includesFood" BOOLEAN NOT NULL DEFAULT false;


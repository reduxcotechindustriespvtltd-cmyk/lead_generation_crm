-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "activities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mealOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "timings" TEXT[] DEFAULT ARRAY[]::TEXT[];

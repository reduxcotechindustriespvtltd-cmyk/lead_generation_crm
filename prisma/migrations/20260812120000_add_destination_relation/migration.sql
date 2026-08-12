-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "destinations_name_key" ON "destinations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- Seed the canonical destinations the gsb-holidays site already hardcodes
-- today, so the CRM-managed list and the site's static fallback agree.
INSERT INTO "destinations" ("id", "name", "slug", "isActive", "order", "updatedAt") VALUES
    ('dest_lonavala', 'Lonavala', 'lonavala', true, 0, CURRENT_TIMESTAMP),
    ('dest_karjat', 'Karjat', 'karjat', true, 1, CURRENT_TIMESTAMP),
    ('dest_panvel', 'Panvel', 'panvel', true, 2, CURRENT_TIMESTAMP),
    ('dest_alibag', 'Alibag', 'alibag', true, 3, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Data backfill: create a Destination row for every distinct existing
-- packages.destination value that doesn't already match one of the above
-- (case-insensitive on name, or on a slugified form of the free text), so
-- no existing package's destination is ever dropped by this migration.
WITH distinct_destinations AS (
    SELECT DISTINCT TRIM("destination") AS raw_name
    FROM "packages"
    WHERE "destination" IS NOT NULL AND TRIM("destination") <> ''
),
unmatched AS (
    SELECT
        dd.raw_name,
        LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(dd.raw_name), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) AS candidate_slug
    FROM distinct_destinations dd
    WHERE NOT EXISTS (
        SELECT 1 FROM "destinations" d
        WHERE LOWER(d."name") = LOWER(dd.raw_name)
           OR d."slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(dd.raw_name), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
    )
),
deduped AS (
    -- one row per distinct candidate_slug, in case two different raw
    -- casings/spellings collapse to the same slug
    SELECT DISTINCT ON (candidate_slug) raw_name, candidate_slug
    FROM unmatched
    ORDER BY candidate_slug, raw_name
)
INSERT INTO "destinations" ("id", "name", "slug", "isActive", "order", "updatedAt")
SELECT
    'dest_auto_' || candidate_slug,
    raw_name,
    candidate_slug,
    true,
    100 + ROW_NUMBER() OVER (ORDER BY raw_name),
    CURRENT_TIMESTAMP
FROM deduped
WHERE candidate_slug <> '';

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "destinationId" TEXT;

-- Data backfill: point every package with a non-empty legacy destination
-- string at the matching Destination row created above. The legacy
-- "destination" column is intentionally left in place (not dropped) as a
-- rollback safety net for this deploy cycle.
UPDATE "packages" p
SET "destinationId" = d."id"
FROM "destinations" d
WHERE p."destination" IS NOT NULL
  AND TRIM(p."destination") <> ''
  AND (
    LOWER(TRIM(p."destination")) = LOWER(d."name")
    OR LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(p."destination"), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) = d."slug"
  );

-- CreateIndex
CREATE INDEX "packages_destinationId_idx" ON "packages"("destinationId");

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

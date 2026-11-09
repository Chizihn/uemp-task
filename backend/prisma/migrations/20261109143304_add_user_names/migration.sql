-- AlterTable: add firstName/lastName (required) + middleName (optional),
-- backfilling existing rows from the email local-part as a placeholder.
ALTER TABLE "users" ADD COLUMN     "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN     "middleName" TEXT;
ALTER TABLE "users" ADD COLUMN     "lastName" TEXT;

UPDATE "users" SET "firstName" = initcap(split_part("email", '@', 1)), "lastName" = 'User'
WHERE "firstName" IS NULL;

ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL;

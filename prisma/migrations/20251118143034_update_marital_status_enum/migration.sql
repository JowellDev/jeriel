/*
  Warnings:

  - The values [WIDOWED] on the enum `MaritalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MaritalStatus_new" AS ENUM ('SINGLE', 'ENGAGED', 'COHABITING', 'MARRIED', 'DIVORCED', 'WIDOWER', 'WIDOW');
ALTER TABLE "users" ALTER COLUMN "maritalStatus" TYPE "MaritalStatus_new" USING ("maritalStatus"::text::"MaritalStatus_new");
ALTER TYPE "MaritalStatus" RENAME TO "MaritalStatus_old";
ALTER TYPE "MaritalStatus_new" RENAME TO "MaritalStatus";
DROP TYPE "public"."MaritalStatus_old";
COMMIT;

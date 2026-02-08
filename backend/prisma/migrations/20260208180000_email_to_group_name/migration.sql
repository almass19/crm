-- AlterTable: Rename email to group_name
ALTER TABLE "clients" DROP COLUMN "email";
ALTER TABLE "clients" ADD COLUMN "group_name" TEXT;

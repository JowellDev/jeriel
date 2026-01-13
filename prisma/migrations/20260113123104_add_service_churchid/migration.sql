-- AlterTable
ALTER TABLE "services" ADD COLUMN     "churchId" VARCHAR(255);

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add publishedAt and scheduledAt to Product
ALTER TABLE "Product" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN "scheduledAt" TIMESTAMP(3);

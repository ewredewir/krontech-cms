-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ComponentType" ADD VALUE 'hero_slider';
ALTER TYPE "ComponentType" ADD VALUE 'video';
ALTER TYPE "ComponentType" ADD VALUE 'stats_banner';
ALTER TYPE "ComponentType" ADD VALUE 'why_kron';
ALTER TYPE "ComponentType" ADD VALUE 'contact_section';
ALTER TYPE "ComponentType" ADD VALUE 'kuppinger_cole';
ALTER TYPE "ComponentType" ADD VALUE 'product_catalog';
ALTER TYPE "ComponentType" ADD VALUE 'blog_carousel';

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('PARCELLE', 'MAISON', 'APPARTEMENT', 'CHAMBRE', 'GUEST_HOUSE', 'LOCAL_COMMERCIAL', 'TERRAIN_AGRICOLE');

-- CreateEnum
CREATE TYPE "PropertyKind" AS ENUM ('VENTE', 'LOCATION');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DISPONIBLE', 'RESERVE', 'CONCLU');

-- CreateEnum
CREATE TYPE "AreaUnit" AS ENUM ('M2', 'ARE', 'HECTARE');

-- CreateEnum
CREATE TYPE "RentPeriod" AS ENUM ('NUIT', 'MOIS', 'AN');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "kind" "PropertyKind" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL,
    "district" TEXT,
    "areaValue" DOUBLE PRECISION,
    "areaUnit" "AreaUnit" NOT NULL DEFAULT 'M2',
    "areaM2" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "titleDeed" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "rentPeriod" "RentPeriod",
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyInquiry" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'NOUVEAU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),

    CONSTRAINT "PropertyInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Property_published_status_createdAt_idx" ON "Property"("published", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Property_type_kind_idx" ON "Property"("type", "kind");

-- CreateIndex
CREATE INDEX "PropertyInquiry_status_createdAt_idx" ON "PropertyInquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PropertyInquiry_propertyId_idx" ON "PropertyInquiry"("propertyId");

-- AddForeignKey
ALTER TABLE "PropertyInquiry" ADD CONSTRAINT "PropertyInquiry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

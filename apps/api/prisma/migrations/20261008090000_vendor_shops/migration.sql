-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN "slug" TEXT,
ADD COLUMN "shopName" TEXT,
ADD COLUMN "shopDescription" TEXT,
ADD COLUMN "shopWhatsapp" TEXT,
ADD COLUMN "shopPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VendorDailyStat" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "contacts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VendorDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_slug_key" ON "VendorProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VendorDailyStat_vendorId_day_key" ON "VendorDailyStat"("vendorId", "day");

-- AddForeignKey
ALTER TABLE "VendorDailyStat" ADD CONSTRAINT "VendorDailyStat_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "vatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "vatDefaultDisplay" TEXT NOT NULL DEFAULT 'TTC',
    "markupPct" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "storageFreeDays" INTEGER NOT NULL DEFAULT 30,
    "storageFeePct" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "storageFeeMonthly" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "vatRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

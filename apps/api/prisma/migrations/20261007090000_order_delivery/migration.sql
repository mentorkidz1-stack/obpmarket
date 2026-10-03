-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('RETRAIT', 'LIVRAISON');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('A_PREPARER', 'PREPAREE', 'EN_ROUTE', 'LIVREE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'RETRAIT',
ADD COLUMN "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "deliveryZoneName" TEXT,
ADD COLUMN "deliveryAddress" TEXT,
ADD COLUMN "deliveryPhone" TEXT,
ADD COLUMN "deliveryNote" TEXT,
ADD COLUMN "deliveryStatus" "DeliveryStatus",
ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "depotId" TEXT;

-- CreateIndex
CREATE INDEX "Order_deliveryMode_status_idx" ON "Order"("deliveryMode", "status");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

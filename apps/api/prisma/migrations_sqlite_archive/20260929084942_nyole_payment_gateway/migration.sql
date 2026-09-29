-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN "nyoleSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_nyoleSessionId_key" ON "Order"("nyoleSessionId");

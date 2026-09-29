-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'AGENT', 'AGENT_MAGASIN', 'GESTIONNAIRE_PRIX', 'GESTIONNAIRE_LIQUIDITE', 'MODERATEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('VALIDE', 'A_CONTROLER', 'REJETE');

-- CreateEnum
CREATE TYPE "FulfillmentMode" AS ENUM ('RETRAIT', 'DEPOT');

-- CreateEnum
CREATE TYPE "StockMovementKind" AS ENUM ('DEPOT', 'LIQUIDITE', 'REVENTE');

-- CreateEnum
CREATE TYPE "LiquidityRequestStatus" AS ENUM ('EN_ATTENTE', 'OFFRE_ENVOYEE', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "ResaleListingStatus" AS ENUM ('EN_VENTE', 'VENDU', 'ANNULE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('EN_ATTENTE_PAIEMENT', 'EN_VERIFICATION', 'PAYEE', 'RETIREE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MTN_MOMO', 'MOOV_MONEY');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MANUEL', 'NYOLE');

-- CreateEnum
CREATE TYPE "OrderFillSource" AS ENUM ('REVENTE', 'VENDEUR', 'STOCK_OBP');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('PARTICULIER', 'PROFESSIONNEL', 'COOPERATIVE');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('EN_ATTENTE', 'ACTIF', 'SUSPENDU', 'REFUSE');

-- CreateEnum
CREATE TYPE "VendorListingStatus" AS ENUM ('EN_ATTENTE', 'A_CORRIGER', 'VALIDEE', 'EN_VENTE', 'EPUISEE', 'REFUSEE');

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "linkUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketAssignment" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,

    CONSTRAINT "MarketAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "isPerishable" BOOLEAN NOT NULL DEFAULT false,
    "isStockable" BOOLEAN NOT NULL DEFAULT true,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockHolding" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "avgUnitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "kind" "StockMovementKind" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "LiquidityRequestStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "offeredUnitPrice" DOUBLE PRECISION,
    "offeredById" TEXT,
    "offeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResaleListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "ResaleListingStatus" NOT NULL DEFAULT 'EN_VENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "ResaleListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'EN_ATTENTE_PAIEMENT',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentProvider" "PaymentProvider",
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "paymentSubmittedAt" TIMESTAMP(3),
    "nyoleSessionId" TEXT,
    "confirmedById" TEXT,
    "paidAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "fulfillment" "FulfillmentMode" NOT NULL DEFAULT 'RETRAIT',
    "withdrawalCode" TEXT,
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderFill" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "source" "OrderFillSource" NOT NULL,
    "sourceId" TEXT,
    "sellerId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "settledAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "OrderFill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceReading" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quality" TEXT,
    "photoUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "distanceToMarketMeters" DOUBLE PRECISION,
    "status" "ReadingStatus" NOT NULL DEFAULT 'VALIDE',
    "flagReason" TEXT,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferencePrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "readingsCount" INTEGER NOT NULL,
    "marketsCount" INTEGER NOT NULL,
    "windowHours" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferencePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VendorType" NOT NULL,
    "zone" TEXT NOT NULL,
    "paymentInfo" TEXT NOT NULL,
    "status" "VendorStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "VendorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorListing" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "status" "VendorListingStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "VendorListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_active_position_idx" ON "Banner"("active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "OtpCode_phone_idx" ON "OtpCode"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Market_name_city_key" ON "Market"("name", "city");

-- CreateIndex
CREATE UNIQUE INDEX "MarketAssignment_agentId_marketId_key" ON "MarketAssignment"("agentId", "marketId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_unitLabel_key" ON "Product"("name", "unitLabel");

-- CreateIndex
CREATE UNIQUE INDEX "StockHolding_ownerId_productId_key" ON "StockHolding"("ownerId", "productId");

-- CreateIndex
CREATE INDEX "ResaleListing_productId_status_createdAt_idx" ON "ResaleListing"("productId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_ownerId_idx" ON "WalletTransaction"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_nyoleSessionId_key" ON "Order"("nyoleSessionId");

-- CreateIndex
CREATE INDEX "Order_clientId_idx" ON "Order"("clientId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "PriceReading_productId_recordedAt_idx" ON "PriceReading"("productId", "recordedAt");

-- CreateIndex
CREATE INDEX "PriceReading_status_idx" ON "PriceReading"("status");

-- CreateIndex
CREATE INDEX "ReferencePrice_productId_computedAt_idx" ON "ReferencePrice"("productId", "computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_userId_key" ON "VendorProfile"("userId");

-- CreateIndex
CREATE INDEX "VendorListing_productId_status_idx" ON "VendorListing"("productId", "status");

-- AddForeignKey
ALTER TABLE "MarketAssignment" ADD CONSTRAINT "MarketAssignment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketAssignment" ADD CONSTRAINT "MarketAssignment_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHolding" ADD CONSTRAINT "StockHolding_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockHolding" ADD CONSTRAINT "StockHolding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityRequest" ADD CONSTRAINT "LiquidityRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityRequest" ADD CONSTRAINT "LiquidityRequest_offeredById_fkey" FOREIGN KEY ("offeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityRequest" ADD CONSTRAINT "LiquidityRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResaleListing" ADD CONSTRAINT "ResaleListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResaleListing" ADD CONSTRAINT "ResaleListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderFill" ADD CONSTRAINT "OrderFill_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceReading" ADD CONSTRAINT "PriceReading_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceReading" ADD CONSTRAINT "PriceReading_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceReading" ADD CONSTRAINT "PriceReading_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceReading" ADD CONSTRAINT "PriceReading_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferencePrice" ADD CONSTRAINT "ReferencePrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorListing" ADD CONSTRAINT "VendorListing_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorListing" ADD CONSTRAINT "VendorListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorListing" ADD CONSTRAINT "VendorListing_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

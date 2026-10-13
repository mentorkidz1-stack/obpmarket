-- CreateTable
CREATE TABLE "VendorInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "phone" TEXT,
    "type" "VendorType",
    "zone" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "VendorInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvite_token_key" ON "VendorInvite"("token");

-- CreateIndex
CREATE INDEX "VendorInvite_createdAt_idx" ON "VendorInvite"("createdAt");

-- AddForeignKey
ALTER TABLE "VendorInvite" ADD CONSTRAINT "VendorInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvite" ADD CONSTRAINT "VendorInvite_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

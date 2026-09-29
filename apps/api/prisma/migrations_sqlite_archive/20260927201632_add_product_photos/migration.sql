-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "isPerishable" BOOLEAN NOT NULL DEFAULT false,
    "isStockable" BOOLEAN NOT NULL DEFAULT true,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "createdAt", "id", "isPerishable", "isStockable", "name", "stockQuantity", "unitLabel") SELECT "categoryId", "createdAt", "id", "isPerishable", "isStockable", "name", "stockQuantity", "unitLabel" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_name_unitLabel_key" ON "Product"("name", "unitLabel");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

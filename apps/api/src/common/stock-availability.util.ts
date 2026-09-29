import { LiquidityRequestStatus, ResaleListingStatus } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service.js';

/**
 * Un dépôt peut être engagé dans une demande de liquidité en cours ET/OU une annonce de
 * revente en même temps : cette fonction centralise le calcul pour ne jamais laisser un
 * client réserver deux fois le même stock (utilisée par LiquidityService et ResaleService).
 */
export async function computeAvailableQuantity(
  prisma: PrismaService,
  ownerId: string,
  productId: string,
): Promise<{ quantity: number; reserved: number; available: number }> {
  const holding = await prisma.stockHolding.findUnique({
    where: { ownerId_productId: { ownerId, productId } },
  });
  const quantity = holding?.quantity ?? 0;

  const [liquidity, resale] = await Promise.all([
    prisma.liquidityRequest.aggregate({
      where: {
        clientId: ownerId,
        productId,
        status: { in: [LiquidityRequestStatus.EN_ATTENTE, LiquidityRequestStatus.OFFRE_ENVOYEE] },
      },
      _sum: { quantity: true },
    }),
    prisma.resaleListing.aggregate({
      where: { sellerId: ownerId, productId, status: ResaleListingStatus.EN_VENTE },
      _sum: { quantity: true },
    }),
  ]);

  const reserved = (liquidity._sum.quantity ?? 0) + (resale._sum.quantity ?? 0);
  return { quantity, reserved, available: quantity - reserved };
}

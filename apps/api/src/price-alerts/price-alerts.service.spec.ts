import { describe, expect, it, vi } from 'vitest';
import { PriceAlertsService } from './price-alerts.service.js';

function setup(alerts: Array<{ id: string; userId: string; productId: string; targetPrice: number; product: { name: string; unitLabel: string } }>) {
  const prisma = {
    priceAlert: {
      findMany: vi.fn().mockResolvedValue(alerts),
      update: vi.fn().mockResolvedValue({}),
    },
  };
  const notifications = { notify: vi.fn().mockResolvedValue(undefined) };
  const service = new PriceAlertsService(prisma as never, notifications as never);
  return { service, prisma, notifications };
}

describe('PriceAlertsService.check', () => {
  it('cherche les alertes actives dont le seuil est supérieur ou égal au nouveau prix', async () => {
    const { service, prisma } = setup([]);
    await service.check('p1', 20_000);
    expect(prisma.priceAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productId: 'p1', active: true, targetPrice: { gte: 20_000 } } }),
    );
  });

  it('notifie chaque client concerné puis désactive son alerte', async () => {
    const { service, prisma, notifications } = setup([
      { id: 'a1', userId: 'u1', productId: 'p1', targetPrice: 21_000, product: { name: 'Gari', unitLabel: 'sac 50 kg' } },
      { id: 'a2', userId: 'u2', productId: 'p1', targetPrice: 25_000, product: { name: 'Gari', unitLabel: 'sac 50 kg' } },
    ]);

    const count = await service.check('p1', 20_500);

    expect(count).toBe(2);
    expect(notifications.notify).toHaveBeenCalledTimes(2);
    const [userId, input] = notifications.notify.mock.calls[0];
    expect(userId).toBe('u1');
    expect(input.title).toBe('Baisse de prix : Gari');
    expect(input.body).toContain('21');
    expect(input.href).toBe('/produits/p1');
    expect(prisma.priceAlert.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { active: false, triggeredAt: expect.any(Date) } });
  });

  it('ne fait rien quand aucune alerte n\'est atteinte', async () => {
    const { service, notifications } = setup([]);
    expect(await service.check('p1', 30_000)).toBe(0);
    expect(notifications.notify).not.toHaveBeenCalled();
  });
});

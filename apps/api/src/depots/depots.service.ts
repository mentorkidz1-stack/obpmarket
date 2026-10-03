import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateDepotDto, CreateZoneDto, UpdateDepotDto, UpdateZoneDto } from './dto/depot.dto.js';

@Injectable()
export class DepotsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Dépôts ----

  findActive() {
    return this.prisma.depot.findMany({ where: { active: true }, orderBy: [{ city: 'asc' }, { name: 'asc' }] });
  }

  findAll() {
    return this.prisma.depot.findMany({
      orderBy: [{ active: 'desc' }, { city: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { listings: true, zones: true } } },
    });
  }

  create(dto: CreateDepotDto) {
    return this.prisma.depot.create({
      data: { ...dto, name: dto.name.trim(), city: dto.city.trim(), address: dto.address.trim() },
    });
  }

  async update(id: string, dto: UpdateDepotDto) {
    await this.findDepot(id);
    return this.prisma.depot.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const depot = await this.prisma.depot.findUnique({ where: { id }, include: { _count: { select: { listings: true } } } });
    if (!depot) throw new NotFoundException('Dépôt introuvable.');
    if (depot._count.listings > 0) {
      throw new ConflictException(`${depot._count.listings} annonce(s) ont été reçues dans ce dépôt : désactivez-le plutôt que de le supprimer.`);
    }
    await this.prisma.depot.delete({ where: { id } });
    return { deleted: true, name: depot.name };
  }

  /** Vérifie qu'un dépôt peut recevoir de la marchandise (existe et actif). */
  async assertUsable(id: string) {
    const depot = await this.findDepot(id);
    if (!depot.active) throw new BadRequestException('Ce dépôt est désactivé.');
    return depot;
  }

  async hasActiveDepots() {
    return (await this.prisma.depot.count({ where: { active: true } })) > 0;
  }

  private async findDepot(id: string) {
    const depot = await this.prisma.depot.findUnique({ where: { id } });
    if (!depot) throw new NotFoundException('Dépôt introuvable.');
    return depot;
  }

  // ---- Zones de livraison ----

  findActiveZones() {
    return this.prisma.deliveryZone.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: { depot: { select: { id: true, name: true, city: true } } },
    });
  }

  findAllZones() {
    return this.prisma.deliveryZone.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      include: { depot: { select: { id: true, name: true, city: true } } },
    });
  }

  async createZone(dto: CreateZoneDto) {
    if (dto.depotId) await this.findDepot(dto.depotId);
    return this.prisma.deliveryZone.create({ data: { name: dto.name.trim(), fee: dto.fee, depotId: dto.depotId ?? null } });
  }

  async updateZone(id: string, dto: UpdateZoneDto) {
    const zone = await this.prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException('Zone introuvable.');
    if (dto.depotId) await this.findDepot(dto.depotId);
    return this.prisma.deliveryZone.update({ where: { id }, data: dto });
  }

  async removeZone(id: string) {
    const zone = await this.prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException('Zone introuvable.');
    await this.prisma.deliveryZone.delete({ where: { id } });
    return { deleted: true, name: zone.name };
  }
}
